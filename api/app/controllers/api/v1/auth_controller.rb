module Api
  module V1
    class AuthController < ApplicationController
      def register
        user = nil
        ActiveRecord::Base.transaction do
          studio = Studio.new(studio_params)
          studio.trial_ends_at = 14.days.from_now
          studio.subscription_status = "trialing"
          studio.cancellation_policy ||= default_policy
          studio.save!

          user = studio.users.create!(
            email: params[:email].to_s.downcase.strip,
            name: params[:owner_name].presence || params[:email],
            password: params[:password],
            role: "owner",
            account_owner: true,
            bookable: true,
            color: "#f59e0b"
          )

          seed_defaults!(studio, user)
        end

        render json: auth_payload(user), status: :created
      end

      def login
        matches = accounts_for(params[:email], params[:password])
        if matches.empty?
          render json: { error: "E-mail ou senha inválidos" }, status: :unauthorized
        elsif matches.one?
          render json: auth_payload(matches.first)
        else
          render json: {
            choose_studio: true,
            login_token: JsonWebToken.encode_choice(matches.map(&:id)),
            studios: matches.map { |user| studio_choice(user) }
          }
        end
      end

      def choose_studio
        ids = JsonWebToken.decode_choice(params[:login_token])
        user = User.where(id: ids, active: true).find_by(id: params[:user_id])
        if user && ids.include?(user.id)
          render json: auth_payload(user)
        else
          render json: { error: "Essa escolha expirou. Entre de novo." }, status: :unauthorized
        end
      end

      def me
        authenticate!
        return unless current_user

        render json: me_payload(current_user)
      end

      private

      def accounts_for(email, password)
        normalized = email.to_s.downcase.strip
        return [] if normalized.blank? || password.blank?

        User.where(active: true).where("LOWER(email) = ?", normalized).includes(:studio).select do |user|
          user.authenticate(password)
        end.sort_by { |user| user.studio.name.to_s.downcase }
      end

      def studio_choice(user)
        {
          user_id: user.id,
          name: user.studio.name,
          slug: user.studio.slug,
          role: user.role
        }
      end

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

      def seed_defaults!(studio, _artist)
        studio.services.create!([
          { name: "Consulta de projeto", kind: "consultation", duration_minutes: 60, price_from_cents: 0 },
          { name: "Sessão de tatuagem", kind: "session", duration_minutes: 180, price_from_cents: 350_00 },
          { name: "Retoque", kind: "touch_up", duration_minutes: 90, price_from_cents: 150_00 }
        ])

        (1..5).each do |dow|
          studio.working_hours.create!(artist_id: nil, day_of_week: dow, opens_at: "10:00", closes_at: "19:00")
        end
      end
    end
  end
end