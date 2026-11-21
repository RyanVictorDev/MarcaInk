class Appointment < ApplicationRecord
  belongs_to :studio
  belongs_to :artist, class_name: "User"
  belongs_to :service

  before_validation :set_cancel_token, on: :create
  before_validation :set_ends_at, on: :create

  validates :customer_name, :customer_email, :customer_phone, :starts_at, presence: true
  validates :status, inclusion: { in: %w[pending confirmed completed cancelled no_show] }
  validates :source, inclusion: { in: %w[public manual] }

  scope :upcoming, -> { where(status: %w[pending confirmed]).where("starts_at >= ?", Time.current) }
  scope :for_range, ->(from, to) { where("starts_at < ? AND ends_at > ?", to, from) }

  private

  def set_cancel_token
    self.cancel_token ||= SecureRandom.urlsafe_base64(24)
  end

  def set_ends_at
    return if ends_at.present? || service.nil? || starts_at.nil?

    total = service.duration_minutes + (studio&.buffer_minutes || 0)
    self.ends_at = starts_at + total.minutes
  end
end