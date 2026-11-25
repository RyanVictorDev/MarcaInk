module Api
  module V1
    class BillingController < ApplicationController
      before_action :authenticate!
      before_action :require_owner!

      def checkout
        plan = params[:plan].presence || "solo"
        current_studio.update!(plan: plan)

        api_key = ENV["ABACATEPAY_API_KEY"]
        if api_key.blank?
          current_studio.update!(subscription_status: "active", trial_ends_at: nil)
          return render json: {
            mode: "mock",
            message: "Modo demonstração: assinatura ativada localmente. Configure ABACATEPAY_API_KEY em produção.",
            studio: { subscription_status: current_studio.subscription_status, plan: current_studio.plan }
          }
        end

        render json: {
          mode: "abacate",
          checkout_url: ENV.fetch("ABACATEPAY_CHECKOUT_URL", "https://abacatepay.com"),
          plan: plan,
          message: "Redirecione o cliente para o checkout AbacatePay com o produto do plano #{plan}."
        }
      end
    end
  end
end