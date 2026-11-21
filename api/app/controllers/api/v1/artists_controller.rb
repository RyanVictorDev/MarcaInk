module Api
  module V1
    class ArtistsController < ApplicationController
      before_action :authenticate!

      def index
        artists = current_studio.users.where(role: %w[artist owner]).order(:name)
        render json: { artists: artists.map { |a| artist_json(a) } }
      end

      def create
        artist = current_studio.users.create!(artist_params.merge(role: "artist"))
        render json: { artist: artist_json(artist) }, status: :created
      end

      def update
        artist = current_studio.users.find(params[:id])
        artist.update!(artist_params)
        render json: { artist: artist_json(artist) }
      end

      private

      def artist_params
        params.require(:artist).permit(:name, :email, :color, :active, :password)
      end

      def artist_json(a)
        a.as_json(only: %i[id name email role color active])
      end
    end
  end
end