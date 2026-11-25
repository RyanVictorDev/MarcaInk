class ClosedDay < ApplicationRecord
  belongs_to :studio

  validates :day, presence: true
  validates :day, uniqueness: { scope: :studio_id, message: "já está fechado" }
  validates :note, length: { maximum: 80 }, allow_blank: true
  validate :not_in_the_past, on: :create

  before_validation :normalize_note

  private

  def normalize_note
    self.note = note.to_s.strip.presence
  end

  def not_in_the_past
    return if day.blank? || studio.blank?

    zone = ActiveSupport::TimeZone[studio.timezone] || Time.zone
    errors.add(:day, "não pode ser no passado") if day < zone.today
  end
end