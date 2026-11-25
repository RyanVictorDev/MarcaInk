class Studio < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :services, dependent: :destroy
  has_many :working_hours, dependent: :destroy
  has_many :closed_days, dependent: :destroy
  has_many :blocks, dependent: :destroy
  has_many :appointments, dependent: :destroy
  has_many :notifications, dependent: :delete_all

  validates :name, :slug, presence: true
  validates :slug, uniqueness: { message: "já está em uso" },
    format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/, message: "só pode ter letras minúsculas, números e hífen" },
    length: { in: 3..40 }
  validates :cancellation_policy, length: { maximum: 800 }, allow_blank: true
  validate :studio_details

  before_validation :normalize_slug

  def subscription_active?
    %w[active trialing].include?(subscription_status) &&
      (subscription_status != "trialing" || trial_ends_at.nil? || trial_ends_at > Time.current)
  end

  def artists
    users.artists
  end

  def artist_limit
    case plan
    when "studio" then 5
    when "pro" then nil
    else 1
    end
  end

  def artist_limit_reached?
    limit = artist_limit
    limit.present? && artists.count >= limit
  end

  def artist_limit_message
    return if artist_limit.nil?

    if plan == "studio"
      "O plano Studio inclui até 5 tatuadores. O plano Pro libera a equipe inteira."
    else
      "O plano Solo inclui 1 tatuador. Para incluir mais gente, mude para Studio ou Pro."
    end
  end

  private

  def normalize_slug
    self.slug = slug.to_s.downcase.strip.gsub(/[^a-z0-9-]/, "-").squeeze("-").gsub(/\A-|-\z/, "") if slug.present?
    self.phone = ContactValidation.normalize_phone(phone) if phone.present?
    return if instagram.blank?

    handle = instagram.to_s.strip.sub(%r{\Ahttps?://(?:www\.)?instagram\.com/}i, "").delete_prefix("@").split("/").first.to_s
    self.instagram = handle.present? ? "@#{handle}" : nil
  end

  def studio_details
    if name.present? && (message = ContactValidation.place_name_error(name))
      errors.add(:name, message)
    end

    if phone.present?
      message = ContactValidation.phone_error(phone)
      errors.add(:phone, message) if message
    end

    return if instagram.blank?
    errors.add(:instagram, "deve ser um @ válido") unless instagram.match?(/\A@[A-Za-z0-9._]{1,30}\z/)
  end
end