module Api
  module V1
    class PasswordsController < ApplicationController
      def forgot
        email = params[:email].to_s.downcase.strip
        links = active_accounts(email).map { |user| reset_link(user) }

        if links.any? && smtp_configured?
          begin
            PasswordResetMailer.reset_links(email, links).deliver_now
          rescue StandardError => error
            Rails.logger.error("Falha ao enviar redefinição de senha: #{error.class}")
            return render json: { error: "Não foi possível enviar o e-mail agora. Tente de novo em instantes." }, status: :service_unavailable
          end
        elsif links.any? && !preview_allowed?
          Rails.logger.info("Redefinição sem SMTP para os usuários #{links.map { |link| link[:user_id] }.join(', ')}")
        end

        body = {
          message: "Se esse e-mail estiver cadastrado, enviamos um link para criar a senha nova. Ele vale por 30 minutos."
        }
        body[:preview] = links.map { |link| link.except(:user_id) } if preview_allowed? && links.any?
        render json: body
      end

      def show
        user = user_from_token(params[:token])
        if user
          render json: { studio: user.studio.name }
        else
          render json: { error: "Esse link expirou. Peça outro." }, status: :unauthorized
        end
      end

      def update
        user = user_from_token(params[:token])
        unless user
          return render json: { error: "Esse link expirou. Peça outro." }, status: :unauthorized
        end

        password = params[:password].to_s
        if password != params[:password_confirmation].to_s
          return render json: { error: "As senhas não são iguais." }, status: :unprocessable_entity
        end

        user.password = password
        user.save!
        render json: { ok: true }
      end

      private

      def active_accounts(email)
        return [] if email.blank?

        User.where(active: true).where("LOWER(email) = ?", email).includes(:studio).sort_by do |user|
          user.studio.name.to_s.downcase
        end
      end

      def reset_link(user)
        token = user.generate_token_for(:password_reset)
        {
          user_id: user.id,
          name: user.studio.name,
          role: user.role,
          url: "#{web_origin}/redefinir-senha?token=#{CGI.escape(token)}"
        }
      end

      def user_from_token(token)
        return nil if token.blank?

        user = User.find_by_token_for(:password_reset, token)
        user if user&.active?
      end

      def web_origin
        ENV.fetch("WEB_ORIGIN", "http://127.0.0.1:3042").to_s.chomp("/")
      end

      def smtp_configured?
        ENV["SMTP_ADDRESS"].present?
      end

      def preview_allowed?
        !smtp_configured? && ENV["ALLOW_PASSWORD_RESET_PREVIEW"] == "1"
      end
    end
  end
end
