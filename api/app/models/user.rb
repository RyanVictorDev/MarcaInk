class User < ApplicationRecord
  has_secure_password
  generates_token_for :password_reset, expires_in: 30.minutes do
    password_digest.last(10)
  end

  belongs_to :studio
  has_many :appointments, foreign_key: :artist_id, dependent: :restrict_with_error
  has_many :notifications, dependent: :delete_all
  has_many :blocks, foreign_key: :artist_id, dependent: :destroy
  has_many :working_hours, foreign_key: :artist_id, dependent: :destroy

  validates :email, :name, presence: true
  validates :email, uniqueness: { scope: :studio_id, case_sensitive: false, message: "já está em uso" }
  ROLES = %w[owner lead artist].freeze
  ASSIGNABLE_ROLES = %w[lead artist].freeze

  validates :role, inclusion: { in: ROLES }
  validate :account_details
  validate :artist_seat_available
  before_validation :normalize_account

  scope :artists, -> { where(bookable: true, active: true) }

  def owner?
    role == "owner"
  end

  def lead?
    role == "lead"
  end

  def artist?
    role == "artist"
  end

  def manager?
    owner? || lead?
  end

  def self.role_label(value)
    { "owner" => "Dono", "lead" => "Tatuador responsável", "artist" => "Tatuador" }[value] || "Tatuador"
  end

  private

  def name_error
    return ContactValidation.person_name_error(name) if owner? && !bookable?
    return "Informe o nome." if name.blank?
    return "O nome está curto demais." if name.length < 2
    return "O nome está longo demais." if name.length > 60
    return "Use letras no nome." unless name.match?(/\A[\p{L}0-9][\p{L}0-9 .'\-]*\z/)

    nil
  end

  def normalize_account
    self.email = email.to_s.strip.downcase
    self.name = name.to_s.strip.gsub(/\s+/, " ")
  end

  def account_details
    if name.present? && (message = name_error)
      errors.add(:name, message)
    end

    if email.present? && !ContactValidation.email?(email)
      errors.add(:email, "precisa ser completo, como nome@email.com")
    end

    return if password.blank?

    errors.add(:password, "precisa ter pelo menos 8 caracteres") if password.length < 8
    errors.add(:password, "precisa ter letras e números") unless password.match?(/[A-Za-z]/) && password.match?(/\d/)
  end

  def artist_seat_available
    return if studio_id.blank?
    return unless bookable? && active?
    return unless new_record? || will_save_change_to_active? || will_save_change_to_bookable?

    Studio.where(id: studio_id).lock("FOR UPDATE").pick(:id)
    return unless studio.artist_limit_reached?

    errors.add(:base, studio.artist_limit_message)
  end
end