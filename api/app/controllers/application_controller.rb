class ApplicationController < ActionController::API
  include Authenticatable

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable

  private

  def not_found
    render json: { error: "Não encontrado" }, status: :not_found
  end

  def unprocessable(exception)
    record = exception.record
    render json: {
      error: record.errors.full_messages.to_sentence(words_connector: ", ", two_words_connector: " e ", last_word_connector: " e "),
      fields: record.errors.messages
    }, status: :unprocessable_entity
  end
end