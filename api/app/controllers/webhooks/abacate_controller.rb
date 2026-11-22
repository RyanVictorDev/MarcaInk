module Webhooks
  class AbacateController < ApplicationController
    def create
      payload = request.request_parameters
      event_id = payload["id"].presence || payload.dig("data", "id").presence || SecureRandom.uuid
      event_type = payload["event"].presence || payload["type"].presence || "unknown"

      AbacateWebhookEvent.transaction do
        event = AbacateWebhookEvent.lock.find_by(event_id: event_id)
        return head :ok if event&.processed_at.present?

        event ||= AbacateWebhookEvent.create!(event_id: event_id, event_type: event_type, payload: payload)
        handle_event(event_type, payload)
        event.update!(processed_at: Time.current)
      end

      head :ok
    rescue ActiveRecord::RecordNotUnique
      head :ok
    end

    private

    def handle_event(type, payload)
      subscription_id = payload.dig("data", "subscription_id") || payload.dig("data", "id")
      studio = Studio.find_by(abacate_subscription_id: subscription_id) if subscription_id

      case type
      when "subscription.completed", "subscription.renewed"
        studio&.update!(subscription_status: "active")
      when "subscription.payment_failed"
        studio&.update!(subscription_status: "past_due")
      when "subscription.cancelled"
        studio&.update!(subscription_status: "cancelled")
      end
    end
  end
end