module Api
  module V1
    class ArtistsController < ApplicationController
      before_action :authenticate!
      before_action :require_manager!
      before_action :require_active_subscription!, except: [ :index ]

      COLORS = %w[#f59e0b #e11d48 #7c3aed #0284c7 #059669 #db2777 #ca8a04 #44403c].freeze

      def index
        artists = current_studio.users.artists.order(:name)
        render json: {
          artists: artists.map { |artist| artist_json(artist) },
          plan: current_studio.plan,
          artist_limit: current_studio.artist_limit
        }
      end

      def create
        role = role_for_create
        return if performed?

        artist = current_studio.with_lock do
          attrs = artist_params.merge(role: role, active: true, bookable: true, account_owner: false)
          attrs[:password] = SecureRandom.hex(12) if attrs[:password].blank?
          attrs[:color] = COLORS.first if attrs[:color].blank?
          current_studio.users.create!(attrs)
        end
        render json: { artist: artist_json(artist) }, status: :created
      end

      def update
        artist = bookable_artists.find(params[:id])
        return unless can_edit!(artist)

        attrs = artist_params
        return unless apply_role!(artist, attrs)

        artist.update!(attrs)
        render json: { artist: artist_json(artist) }
      end

      def destroy
        artist = bookable_artists.find(params[:id])
        if artist.account_owner?
          return render json: { error: "Essa é a conta do dono. Ela continua no link." }, status: :unprocessable_entity
        end
        return unless can_edit!(artist)
        if artist.appointments.exists?
          artist.update!(active: false)
        else
          artist.destroy!
        end
        head :no_content
      end

      private

      def bookable_artists
        current_studio.users.where(bookable: true)
      end

      def role_for_create
        requested = params.dig(:artist, :role).to_s.presence || "artist"
        if !current_user.owner?
          if requested != "artist"
            render json: { error: "Só o dono pode definir cargos." }, status: :forbidden
            return
          end
          return "artist"
        end
        unless User::ASSIGNABLE_ROLES.include?(requested)
          render json: { error: "Escolha tatuador responsável ou tatuador." }, status: :unprocessable_entity
          return
        end
        requested
      end

      def can_edit!(artist)
        return true if current_user.owner?
        return true if artist.role == "artist" && !artist.account_owner?

        render json: { error: "Só o dono altera esse cargo." }, status: :forbidden
        false
      end

      def apply_role!(artist, attrs)
        requested = params.dig(:artist, :role).to_s
        return true if requested.blank? || requested == artist.role
        unless current_user.owner?
          render json: { error: "Só o dono pode alterar cargos." }, status: :forbidden
          return false
        end
        if artist.account_owner? || !User::ASSIGNABLE_ROLES.include?(requested)
          render json: { error: "O dono do estúdio permanece como dono." }, status: :unprocessable_entity
          return false
        end
        attrs[:role] = requested
        true
      end

      def artist_params
        permitted = params.require(:artist).permit(:name, :email, :color, :password)
        permitted.delete(:password) if permitted[:password].blank?
        if permitted[:color].present? && !COLORS.include?(permitted[:color])
          permitted.delete(:color)
        end
        permitted
      end

      def artist_json(artist)
        artist.as_json(only: %i[id name email color role account_owner])
      end
    end
  end
end