module Api
  module V1
    class AppointmentsController < ApplicationController
      before_action :authenticate!

      def index
        scope = current_studio.appointments.includes(:artist, :service).order(starts_at: :desc)
        scope = scope.where(status: params[:status]) if params[:status].present?
        if params[:from].present? && params[:to].present?
          scope = scope.where(starts_at: Time.zone.parse(params[:from])..Time.zone.parse(params[:to]))
        end
        render json: { appointments: scope.limit(200).map { |a| appointment_json(a) } }
      end

      def create
        appointment = current_studio.appointments.create!(manual_params.merge(source: "manual", status: "confirmed"))
        render json: { appointment: appointment_json(appointment) }, status: :created
      end

      def update
        appointment = current_studio.appointments.find(params[:id])
        appointment.update!(params.require(:appointment).permit(:status, :notes, :starts_at))
        if appointment.saved_change_to_starts_at?
          appointment.update!(ends_at: appointment.starts_at + appointment.service.duration_minutes.minutes + current_studio.buffer_minutes.minutes)
        end
        render json: { appointment: appointment_json(appointment) }
      end

      private

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