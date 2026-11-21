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
          artist = studio.users.find(params[:artist_id])
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

          artist = studio.users.find(booking_params[:artist_id])
          service = studio.services.active.find(booking_params[:service_id])
          starts_at = Time.zone.parse(booking_params[:starts_at])

          slot_end = starts_at + service.duration_minutes.minutes + studio.buffer_minutes.minutes
          available = AvailabilityService.new(
            studio: studio, artist: artist, service: service,
            from_date: starts_at.to_date, to_date: starts_at.to_date
          ).slots.any? { |s| Time.zone.parse(s[:starts_at]) == starts_at }

          unless available
            return render json: { error: "Horário não está mais disponível." }, status: :conflict
          end

          appointment = studio.appointments.create!(
            booking_params.merge(
              service: service,
              artist: artist,
              starts_at: starts_at,
              ends_at: slot_end,
              source: "public",
              status: "confirmed"
            )
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
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end

        def cancel
          appointment = Appointment.find_by!(cancel_token: params[:token])
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