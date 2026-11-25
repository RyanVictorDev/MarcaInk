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

  def require_manager!
    return if current_user&.manager?

    render json: { error: "Seu cargo não acessa esta área." }, status: :forbidden
  end

  def require_owner!
    return if current_user&.owner?

    render json: { error: "Só o dono pode fazer isso." }, status: :forbidden
  end
end