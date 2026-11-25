module Api
  module V1
    module Public
      class StudiosController < ApplicationController
        def show
          studio = Studio.find_by!(slug: params[:slug])
          render json: {
            studio: {
              name: studio.name,
              slug: studio.slug,
              address: studio.address,
              phone: studio.phone,
              instagram: studio.instagram,
              cancellation_policy: studio.cancellation_policy
            },
            services: studio.services.active.order(:name).map { |s| service_json(s) },
            artists: studio.artists.order(:name).map { |a| { id: a.id, name: a.name, color: a.color } }
          }
        end

        def slots
          studio = Studio.find_by!(slug: params[:slug])
          artist = studio.artists.find(params[:artist_id])
          service = studio.services.active.find(params[:service_id])
          from = params[:from] ? Date.parse(params[:from]) : Date.current
          to = params[:to] ? Date.parse(params[:to]) : from + 13.days

          slots = AvailabilityService.new(studio: studio, artist: artist, service: service, from_date: from, to_date: to).slots
          render json: { slots: slots }
        end

        def book
          studio = Studio.find_by!(slug: params[:slug])
          unless studio.subscription_active?
            return render json: { error: "Estúdio indisponível para agendamento online." }, status: :service_unavailable
          end

          artist = studio.artists.find(booking_params[:artist_id])
          service = studio.services.active.find(booking_params[:service_id])
          starts_at = Time.zone.parse(booking_params[:starts_at])

          appointment = BookingService.create_public!(
            studio: studio,
            artist: artist,
            service: service,
            starts_at: starts_at,
            attrs: booking_params.except(:artist_id, :service_id, :starts_at)
          )

          render json: {
            appointment: {
              id: appointment.id,
              starts_at: appointment.starts_at,
              ends_at: appointment.ends_at,
              cancel_token: appointment.cancel_token,
              studio_name: studio.name
            }
          }, status: :created
        rescue BookingService::SlotUnavailable => e
          render json: { error: e.message }, status: :conflict
        end

        def cancel
          appointment = Appointment.find_by!(cancel_token: params[:token])
          if appointment.status == "cancelled"
            return render json: { message: "Agendamento já estava cancelado." }
          end
          if appointment.starts_at < appointment.studio.cancellation_hours.hours.from_now
            return render json: { error: "Prazo de cancelamento expirado." }, status: :unprocessable_entity
          end
          appointment.update!(status: "cancelled")
          render json: { message: "Agendamento cancelado." }
        end

        private

        def booking_params
          params.require(:booking).permit(:artist_id, :service_id, :starts_at, :customer_name, :customer_email, :customer_phone, :notes)
        end

        def service_json(s)
          {
            id: s.id,
            name: s.name,
            kind: s.kind,
            duration_minutes: s.duration_minutes,
            price_from_cents: s.price_from_cents
          }
        end
      end
    end
  end
end