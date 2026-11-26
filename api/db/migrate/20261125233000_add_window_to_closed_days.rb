class AddWindowToClosedDays < ActiveRecord::Migration[8.1]
  def change
    add_column :closed_days, :starts_at, :time
    add_column :closed_days, :ends_at, :time
    add_check_constraint :closed_days,
      "(starts_at IS NULL AND ends_at IS NULL) OR (starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)",
      name: "closed_days_window"
  end
end
