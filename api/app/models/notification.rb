class Notification < ApplicationRecord
  KINDS = %w[booking].freeze

  belongs_to :studio
  belongs_to :user
  belongs_to :appointment

  validates :kind, inclusion: { in: KINDS }

  scope :unread, -> { where(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
end