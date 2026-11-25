module Api
  module V1
    class StudiosController < ApplicationController
      before_action :authenticate!
      before_action :require_manager!, only: [ :update ]

      def show
        render json: { studio: studio_json(current_studio) }
      end

      def update
        current_studio.update!(studio_params)
        render json: { studio: studio_json(current_studio) }
      end

      private

      def studio_params
        params.require(:studio).permit(
          :name, :slug, :phone, :address, :instagram,
          :cancellation_policy, :cancellation_hours, :buffer_minutes, :min_booking_hours
        )
      end

      def studio_json(studio)
        studio.as_json(only: %i[id name slug phone address instagram cancellation_policy cancellation_hours buffer_minutes min_booking_hours subscription_status plan trial_ends_at])
          .merge(subscription_active: studio.subscription_active?)
      end
    end
  end
end