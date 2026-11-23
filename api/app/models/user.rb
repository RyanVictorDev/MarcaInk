class User < ApplicationRecord
  has_secure_password

  belongs_to :studio
  has_many :appointments, foreign_key: :artist_id, dependent: :restrict_with_error
  has_many :blocks, foreign_key: :artist_id, dependent: :destroy
  has_many :working_hours, foreign_key: :artist_id, dependent: :destroy

  validates :email, :name, presence: true
  validates :email, uniqueness: { scope: :studio_id, case_sensitive: false, message: "já está em uso" }
  validates :role, inclusion: { in: %w[owner artist] }
  validate :account_details
  before_validation :normalize_account

  scope :artists, -> { where(role: "artist", active: true) }

  def owner?
    role == "owner"
  end

  private

  def normalize_account
    self.email = email.to_s.strip.downcase
    self.name = name.to_s.strip.gsub(/\s+/, " ")
  end

  def account_details
    if name.present? && (message = ContactValidation.person_name_error(name))
      errors.add(:name, message)
    end

    if email.present? && !ContactValidation.email?(email)
      errors.add(:email, "precisa ser completo, como nome@email.com")
    end

    return if password.blank?

    errors.add(:password, "precisa ter pelo menos 8 caracteres") if password.length < 8
    errors.add(:password, "precisa ter letras e números") unless password.match?(/[A-Za-z]/) && password.match?(/\d/)
  end
end