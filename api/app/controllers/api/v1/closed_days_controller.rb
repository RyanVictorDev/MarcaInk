module Api
  module V1
    class ClosedDaysController < ApplicationController
      before_action :authenticate!
      before_action :require_manager!
      before_action :require_active_subscription!

      def create
        closed = current_studio.closed_days.create!(closed_day_params)
        render json: { closed_day: { id: closed.id, day: closed.day.iso8601, note: closed.note } }, status: :created
      end

      def destroy
        current_studio.closed_days.find(params[:id]).destroy!
        head :no_content
      end

      private

      def closed_day_params
        params.require(:closed_day).permit(:day, :note)
      end
    end
  end
end