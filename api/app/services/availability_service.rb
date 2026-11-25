class AvailabilityService
  SLOT_STEP = 30.minutes

  def initialize(studio:, artist:, service:, from_date:, to_date:)
    @studio = studio
    @artist = artist
    @service = service
    @from_date = from_date.to_date
    @to_date = to_date.to_date
    @zone = ActiveSupport::TimeZone[studio.timezone] || Time.zone
    @hours = schedule_for(studio, artist).group_by(&:day_of_week)
    @closed_days = studio.closed_days.where(day: @from_date..@to_date).pluck(:day)
  end

  def slots
    return [] unless @service && @artist

    duration = @service.duration_minutes.minutes + @studio.buffer_minutes.minutes
    earliest = @zone.now + @studio.min_booking_hours.hours
    results = []

    (@from_date..@to_date).each do |date|
      windows = hours_for(date)
      next if windows.empty?

      windows.each do |window|
        cursor = window.begin
        while cursor + duration <= window.end
          slot_start = cursor
          slot_end = slot_start + duration
          if slot_start >= earliest && slot_free?(slot_start, slot_end)
            results << {
              starts_at: slot_start.iso8601,
              ends_at: slot_end.iso8601,
              label: slot_start.strftime("%d/%m %H:%M")
            }
          end
          cursor += SLOT_STEP
        end
      end
    end

    results
  end

  private

  def schedule_for(studio, artist)
    studio_hours = studio.working_hours.where(artist_id: nil)
    return studio_hours if studio_hours.exists?

    own = studio.working_hours.where(artist_id: artist.id)
    return own if own.exists?

    # Funcionamento still shows these rows when the studio never saved its own hours.
    # A tatuador added later has none, so they follow that same weekly schedule.
    studio.working_hours.where.not(artist_id: nil).order(:artist_id, :id).to_a
      .group_by(&:day_of_week).values.map(&:first)
  end

  def hours_for(date)
    return [] if @closed_days.include?(date)

    rows = @hours[date.wday] || []
    return [] if rows.empty?

    rows.map do |row|
      start_t = @zone.local(date.year, date.month, date.day, row.opens_at.hour, row.opens_at.min)
      end_t = @zone.local(date.year, date.month, date.day, row.closes_at.hour, row.closes_at.min)
      start_t...end_t
    end
  end

  def slot_free?(start_t, end_t)
    appointments = @studio.appointments
      .where(artist_id: @artist.id)
      .where(status: %w[pending confirmed])
      .for_range(start_t, end_t)
    return false if appointments.exists?

    blocks = @studio.blocks.where(artist_id: @artist.id).where("starts_at < ? AND ends_at > ?", end_t, start_t)
    !blocks.exists?
  end
end