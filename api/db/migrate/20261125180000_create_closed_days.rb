class CreateClosedDays < ActiveRecord::Migration[8.1]
  def change
    create_table :closed_days do |t|
      t.references :studio, null: false, foreign_key: true
      t.date :day, null: false
      t.string :note

      t.timestamps
    end

    add_index :closed_days, [ :studio_id, :day ], unique: true
  end
end