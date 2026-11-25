module Api
  module V1
    class DashboardController < ApplicationController
      before_action :authenticate!

      def show
        studio = current_studio
        today = Time.current.in_time_zone(studio.timezone).beginning_of_day..Time.current.in_time_zone(studio.timezone).end_of_day
        week_end = Time.current.in_time_zone(studio.timezone).end_of_week

        appts = studio.appointments.includes(:artist, :service)
        appts = appts.where(artist_id: current_user.id) if current_user.artist?

        render json: {
          today_count: appts.where(starts_at: today).where(status: %w[pending confirmed]).count,
          week_count: appts.where(starts_at: Time.current..week_end).where(status: %w[pending confirmed]).count,
          upcoming: appts.upcoming.order(:starts_at).limit(8).map { |a| appointment_json(a) },
          public_booking_url: "/s/#{studio.slug}",
          cancellation_rate: cancellation_rate(appts)
        }
      end

      private

      def appointment_json(a)
        {
          id: a.id,
          starts_at: a.starts_at,
          ends_at: a.ends_at,
          status: a.status,
          customer_name: a.customer_name,
          service: a.service.name,
          artist: a.artist.name
        }
      end

      def cancellation_rate(appts)
        total = appts.where("starts_at >= ?", 30.days.ago).count
        return 0 if total.zero?

        cancelled = appts.where("starts_at >= ?", 30.days.ago).where(status: %w[cancelled no_show]).count
        ((cancelled.to_f / total) * 100).round(1)
      end
    end
  end
end