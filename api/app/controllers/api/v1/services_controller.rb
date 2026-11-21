module Api
  module V1
    class ServicesController < ApplicationController
      before_action :authenticate!
      before_action :require_active_subscription!, except: [ :index, :show ]

      def index
        render json: { services: current_studio.services.order(:name).map { |s| service_json(s) } }
      end

      def create
        service = current_studio.services.create!(service_params)
        render json: { service: service_json(service) }, status: :created
      end

      def update
        service = current_studio.services.find(params[:id])
        service.update!(service_params)
        render json: { service: service_json(service) }
      end

      def destroy
        current_studio.services.find(params[:id]).update!(active: false)
        head :no_content
      end

      private

      def service_params
        params.require(:service).permit(:name, :kind, :duration_minutes, :price_from_cents, :active)
      end

      def service_json(s)
        s.as_json(only: %i[id name kind duration_minutes price_from_cents active])
          .merge(price_from_label: format_money(s.price_from_cents))
      end

      def format_money(cents)
        return "Sob consulta" if cents.to_i.zero?

        format("R$ %.2f", cents / 100.0).gsub(".", ",")
      end
    end
  end
end