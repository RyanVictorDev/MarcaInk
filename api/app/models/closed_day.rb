class ClosedDay < ApplicationRecord
  belongs_to :studio

  validates :day, presence: true
  validates :note, length: { maximum: 80 }, allow_blank: true
  validate :not_in_the_past, on: :create
  validate :window_is_complete
  validate :single_closure

  before_validation :normalize_note
  before_validation :normalize_window

  def as_api
    {
      id: id,
      day: day.iso8601,
      note: note,
      starts_at: clock(starts_at),
      ends_at: clock(ends_at)
    }
  end

  def all_day?
    starts_at.blank? && ends_at.blank?
  end

  private

  def normalize_note
    self.note = note.to_s.strip.presence
  end

  def normalize_window
    self.starts_at = nil if starts_at.blank?
    self.ends_at = nil if ends_at.blank?
  end

  def single_closure
    return if day.blank? || studio_id.blank?

    scope = self.class.where(studio_id: studio_id, day: day)
    scope = scope.where.not(id: id) if persisted?
    errors.add(:base, "Esse dia já está fechado.") if scope.exists?
  end

  def window_is_complete
    if starts_at.present? ^ ends_at.present?
      errors.add(:base, "Informe o início e o fim do horário.")
    elsif starts_at.present? && ends_at <= starts_at
      errors.add(:base, "O horário final tem que ser depois do início.")
    end
  end

  def clock(value)
    return nil if value.blank?

    value.strftime("%H:%M")
  end

  def not_in_the_past
    return if day.blank? || studio.blank?

    zone = ActiveSupport::TimeZone[studio.timezone] || Time.zone
    errors.add(:day, "não pode ser no passado") if day < zone.today
  end
end