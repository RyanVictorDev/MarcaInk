class Block < ApplicationRecord
  belongs_to :studio
  belongs_to :artist, class_name: "User"

  validate :ends_after_starts

  private

  def ends_after_starts
    return if starts_at.blank? || ends_at.blank?

    errors.add(:ends_at, "deve ser depois do início") if ends_at <= starts_at
  end
end