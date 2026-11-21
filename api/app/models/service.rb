class Service < ApplicationRecord
  belongs_to :studio
  has_many :appointments, dependent: :restrict_with_error

  validates :name, :kind, :duration_minutes, presence: true
  validates :kind, inclusion: { in: %w[consultation session touch_up] }
  validates :duration_minutes, numericality: { greater_than: 0 }

  scope :active, -> { where(active: true) }
end