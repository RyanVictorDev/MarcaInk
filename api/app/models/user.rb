class User < ApplicationRecord
  has_secure_password

  belongs_to :studio
  has_many :appointments, foreign_key: :artist_id, dependent: :restrict_with_error
  has_many :blocks, foreign_key: :artist_id, dependent: :destroy
  has_many :working_hours, foreign_key: :artist_id, dependent: :destroy

  validates :email, :name, presence: true
  validates :email, uniqueness: { scope: :studio_id, case_sensitive: false }
  validates :role, inclusion: { in: %w[owner artist] }

  scope :artists, -> { where(role: "artist", active: true) }

  def owner?
    role == "owner"
  end
end