class WorkingHour < ApplicationRecord
  belongs_to :studio
  belongs_to :artist, class_name: "User", optional: true

  validates :day_of_week, inclusion: { in: 0..6 }
end