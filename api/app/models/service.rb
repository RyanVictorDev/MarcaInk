class Service < ApplicationRecord
  belongs_to :studio
  has_many :appointments, dependent: :restrict_with_error

  validates :name, :kind, :duration_minutes, presence: true
  validates :name, length: { in: 3..80 }
  validates :kind, inclusion: { in: %w[consultation session touch_up] }
  validates :duration_minutes, numericality: { only_integer: true, greater_than_or_equal_to: 15, less_than_or_equal_to: 720 }
  validates :price_from_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than: 10_000_000 }

  scope :active, -> { where(active: true) }
end