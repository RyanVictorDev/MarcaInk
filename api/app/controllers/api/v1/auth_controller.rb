module Api
  module V1
    class AuthController < ApplicationController
      def register
        studio = nil
        ActiveRecord::Base.transaction do
          studio = Studio.new(studio_params)
          studio.trial_ends_at = 14.days.from_now
          studio.subscription_status = "trialing"
          studio.cancellation_policy ||= default_policy
          studio.save!

          owner = studio.users.build(
            email: params[:email].to_s.downcase.strip,
            name: params[:owner_name].presence || params[:email],
            password: params[:password],
            role: "owner"
          )
          owner.save!

          seed_defaults!(studio, owner)
        end

        user = studio.users.find_by!(role: "owner")
        render json: auth_payload(user), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.record.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end

      def login
        user = User.find_by("LOWER(email) = ?", params[:email].to_s.downcase.strip)
        if user&.authenticate(params[:password])
          render json: auth_payload(user)
        else
          render json: { error: "E-mail ou senha inválidos" }, status: :unauthorized
        end
      end

      def me
        authenticate!
        return unless current_user

        render json: me_payload(current_user)
      end

      private

      def studio_params
        params.require(:studio).permit(:name, :slug, :phone, :address, :instagram)
      end

      def auth_payload(user)
        {
          token: JsonWebToken.encode(user.id),
          user: user_json(user),
          studio: studio_json(user.studio)
        }
      end

      def me_payload(user)
        {
          user: user_json(user),
          studio: studio_json(user.studio)
        }
      end

      def user_json(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          color: user.color
        }
      end

      def studio_json(studio)
        studio.as_json(only: %i[id name slug phone address instagram cancellation_policy cancellation_hours buffer_minutes min_booking_hours subscription_status plan trial_ends_at])
          .merge(subscription_active: studio.subscription_active?)
      end

      def default_policy
        "Cancelamentos devem ser feitos com pelo menos 24h de antecedência. Sessões confirmadas podem exigir sinal."
      end

      def seed_defaults!(studio, owner)
        artist = studio.users.create!(
          name: "Artista convidado",
          email: "artista+#{studio.slug}@marcaink.local",
          password: SecureRandom.hex(16),
          role: "artist",
          color: "#f59e0b"
        )
        owner.update!(color: "#ea580c") if owner.color.blank?

        studio.services.create!([
          { name: "Consulta de projeto", kind: "consultation", duration_minutes: 60, price_from_cents: 0 },
          { name: "Sessão de tatuagem", kind: "session", duration_minutes: 180, price_from_cents: 350_00 },
          { name: "Retoque", kind: "touch_up", duration_minutes: 90, price_from_cents: 150_00 }
        ])

        (1..5).each do |dow|
          next if dow == 0
          studio.working_hours.create!(artist_id: artist.id, day_of_week: dow, opens_at: "10:00", closes_at: "19:00")
        end
      end
    end
  end
end