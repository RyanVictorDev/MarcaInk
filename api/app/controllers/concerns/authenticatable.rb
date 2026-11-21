module Authenticatable
  extend ActiveSupport::Concern

  included do
    attr_reader :current_user, :current_studio
  end

  private

  def authenticate!
    token = request.headers["Authorization"]&.split&.last
    @current_user = JsonWebToken.decode(token)
    render json: { error: "Não autorizado" }, status: :unauthorized unless @current_user
    @current_studio = @current_user&.studio
  end

  def require_active_subscription!
    return if current_studio&.subscription_active?

    render json: { error: "Assinatura inativa. Regularize para continuar.", code: "subscription_inactive" }, status: :payment_required
  end
end