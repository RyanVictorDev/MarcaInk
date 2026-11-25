class WorkingHour < ApplicationRecord
  belongs_to :studio
  belongs_to :artist, class_name: "User", optional: true

  validates :day_of_week, inclusion: { in: 0..6 }
  validates :opens_at, :closes_at, presence: true
  validate :closes_after_open

  private

  def closes_after_open
    return if opens_at.blank? || closes_at.blank?
    return if closes_at > opens_at

    errors.add(:base, "O fechamento precisa ser depois da abertura.")
  end
end