class Appointment < ApplicationRecord
  belongs_to :studio
  belongs_to :artist, class_name: "User"
  belongs_to :service

  before_validation :set_cancel_token, on: :create
  before_validation :set_ends_at, on: :create

  validates :starts_at, presence: true
  validates :status, inclusion: { in: %w[pending confirmed completed cancelled no_show] }
  validates :source, inclusion: { in: %w[public manual] }
  validate :customer_contact, on: :create

  scope :upcoming, -> { where(status: %w[pending confirmed]).where("starts_at >= ?", Time.current) }
  scope :for_range, ->(from, to) { where("starts_at < ? AND ends_at > ?", to, from) }

  private

  def customer_contact
    self.customer_name = customer_name.to_s.strip.gsub(/\s+/, " ")
    self.customer_email = customer_email.to_s.strip.downcase
    self.customer_phone = ContactValidation.normalize_phone(customer_phone)
    self.notes = notes.to_s.strip.presence

    if (message = ContactValidation.person_name_error(customer_name))
      errors.add(:customer_name, message)
    end

    if customer_email.blank?
      errors.add(:customer_email, "não pode ficar em branco")
    elsif !ContactValidation.email?(customer_email)
      errors.add(:customer_email, "precisa ser completo, como nome@email.com")
    end

    if (message = ContactValidation.phone_error(customer_phone))
      errors.add(:customer_phone, message)
    end

    errors.add(:notes, "pode ter no máximo 500 caracteres") if notes.present? && notes.length > 500
  end

  def set_cancel_token
    self.cancel_token ||= SecureRandom.urlsafe_base64(24)
  end

  def set_ends_at
    return if ends_at.present? || service.nil? || starts_at.nil?

    total = service.duration_minutes + (studio&.buffer_minutes || 0)
    self.ends_at = starts_at + total.minutes
  end
end