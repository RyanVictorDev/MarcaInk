module Api
  module V1
    class AppointmentsController < ApplicationController
      before_action :authenticate!

      PER_PAGE = 20
      PERIODS = %w[upcoming past all].freeze
      STATUSES = %w[pending confirmed completed cancelled no_show].freeze

      def index
        scope = filtered_appointments
        total = scope.count
        page = page_number(total)
        rows = scope.includes(:artist, :service).order(starts_at: period == "upcoming" ? :asc : :desc).offset((page - 1) * PER_PAGE).limit(PER_PAGE)
        render json: {
          appointments: rows.map { |appointment| appointment_json(appointment) },
          page: page,
          per_page: PER_PAGE,
          total: total,
          total_pages: (total.to_f / PER_PAGE).ceil,
          artists: artist_options
        }
      end

      def create
        if current_user.artist?
          params[:appointment][:artist_id] = current_user.id if params[:appointment].present?
        end
        appointment = current_studio.appointments.create!(manual_params.merge(source: "manual", status: "confirmed"))
        render json: { appointment: appointment_json(appointment) }, status: :created
      end

      def update
        appointment = visible_appointments.find(params[:id])
        appointment.update!(params.require(:appointment).permit(:status, :notes, :starts_at))
        if appointment.saved_change_to_starts_at?
          appointment.update!(ends_at: appointment.starts_at + appointment.service.duration_minutes.minutes + current_studio.buffer_minutes.minutes)
        end
        render json: { appointment: appointment_json(appointment) }
      end

      private

      def visible_appointments
        scope = current_studio.appointments
        scope = scope.where(artist_id: current_user.id) if current_user.artist?
        scope
      end

      def filtered_appointments
        scope = visible_appointments
        scope = scope.where(status: params[:status]) if STATUSES.include?(params[:status])
        scope = scope.where(artist_id: params[:artist_id]) if current_user.manager? && params[:artist_id].present?
        scope = case period
        when "past" then scope.where(starts_at: ...Time.current)
        when "all" then scope
        else scope.where(starts_at: Time.current..)
        end
        query = params[:q].to_s.strip.first(80)
        if query.present?
          term = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
          scope = scope.where("customer_name ILIKE ?", term)
        end
        scope
      end

      def period
        PERIODS.include?(params[:period]) ? params[:period] : "upcoming"
      end

      def page_number(total)
        page = params[:page].to_i
        page = 1 if page < 1
        pages = (total.to_f / PER_PAGE).ceil
        return 1 if pages.zero?
        [ page, pages ].min
      end

      def artist_options
        return [] unless current_user.manager?

        current_studio.users.where(id: visible_appointments.select(:artist_id)).order(:name).map do |user|
          { id: user.id, name: user.name }
        end
      end

      def manual_params
        p = params.require(:appointment).permit(:artist_id, :service_id, :customer_name, :customer_email, :customer_phone, :notes, :starts_at)
        artist = current_studio.users.find(p[:artist_id])
        service = current_studio.services.find(p[:service_id])
        starts = Time.zone.parse(p[:starts_at])
        ends = starts + service.duration_minutes.minutes + current_studio.buffer_minutes.minutes
        p.merge(artist_id: artist.id, service_id: service.id, starts_at: starts, ends_at: ends)
      end

      def appointment_json(a)
        a.as_json(only: %i[id starts_at ends_at status source customer_name customer_email customer_phone notes cancel_token]).merge(
          artist: { id: a.artist_id, name: a.artist.name },
          service: { id: a.service_id, name: a.service.name }
        )
      end
    end
  end
end