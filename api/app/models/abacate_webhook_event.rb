class AbacateWebhookEvent < ApplicationRecord
  validates :event_id, :event_type, presence: true
end