module Api
  module V1
    class ScheduleController < ApplicationController
      before_action :authenticate!
      before_action :require_manager!, only: [ :update ]
      before_action :require_active_subscription!, only: [ :update ]

      def show
        render json: { hours: hour_rows, closed_days: closed_days_json }
      end

      def update
        rows = schedule_params
        open_rows = rows.select { |row| ActiveModel::Type::Boolean.new.cast(row[:open]) }
        if open_rows.empty?
          return render json: { error: "Deixe pelo menos um dia aberto." }, status: :unprocessable_entity
        end

        ActiveRecord::Base.transaction do
          current_studio.working_hours.where(artist_id: nil).delete_all
          open_rows.each do |row|
            current_studio.working_hours.create!(
              artist_id: nil,
              day_of_week: row[:day_of_week],
              opens_at: row[:opens_at],
              closes_at: row[:closes_at]
            )
          end
        end

        render json: { hours: hour_rows, closed_days: closed_days_json }
      end

      private

      def schedule_params
        params.permit(hours: [ :day_of_week, :open, :opens_at, :closes_at ]).fetch(:hours, [])
      end

      def hour_rows
        stored = current_studio.working_hours.where(artist_id: nil).index_by(&:day_of_week)
        source = stored.presence || fallback_hours
        (0..6).map do |day|
          row = source[day]
          {
            day_of_week: day,
            open: row.present?,
            opens_at: row ? row.opens_at.strftime("%H:%M") : "11:00",
            closes_at: row ? row.closes_at.strftime("%H:%M") : "20:00"
          }
        end
      end

      def fallback_hours
        current_studio.working_hours.where.not(artist_id: nil).order(:artist_id).group_by(&:day_of_week).transform_values(&:first)
      end

      def closed_days_json
        zone = ActiveSupport::TimeZone[current_studio.timezone] || Time.zone
        current_studio.closed_days.where(day: zone.today..).order(:day, :starts_at).map(&:as_api)
      end
    end
  end
end