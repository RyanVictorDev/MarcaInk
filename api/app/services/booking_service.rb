class BookingService
  class SlotUnavailable < StandardError; end

  def self.create_public!(studio:, artist:, service:, starts_at:, attrs:)
    slot_end = starts_at + service.duration_minutes.minutes + studio.buffer_minutes.minutes

    appointment = nil
    studio.with_lock do
      artist.with_lock do
        conflict = studio.appointments
          .where(artist_id: artist.id)
          .where(status: %w[pending confirmed])
          .where("starts_at < ? AND ends_at > ?", slot_end, starts_at)
          .exists?

        block = studio.blocks
          .where(artist_id: artist.id)
          .where("starts_at < ? AND ends_at > ?", slot_end, starts_at)
          .exists?

        raise SlotUnavailable, "Horário não está mais disponível." if conflict || block

        available = AvailabilityService.new(
          studio: studio, artist: artist, service: service,
          from_date: starts_at.to_date, to_date: starts_at.to_date
        ).slots.any? { |s| Time.zone.parse(s[:starts_at]).to_i == starts_at.to_i }

        raise SlotUnavailable, "Horário não está mais disponível." unless available

        appointment = studio.appointments.create!(
          attrs.merge(
            artist: artist,
            service: service,
            starts_at: starts_at,
            ends_at: slot_end,
            source: "public",
            status: "confirmed"
          )
        )
      end
    end

    appointment
  end
end