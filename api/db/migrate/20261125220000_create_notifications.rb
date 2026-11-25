class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :studio, null: false, foreign_key: { on_delete: :cascade }
      t.references :user, null: false, foreign_key: { on_delete: :cascade }, index: false
      t.references :appointment, null: false, foreign_key: { on_delete: :cascade }
      t.string :kind, null: false, default: "booking"
      t.datetime :read_at
      t.timestamps
    end

    add_index :notifications, [ :user_id, :created_at ]
    add_index :notifications, :user_id, where: "read_at IS NULL", name: "index_notifications_on_unread_user"
  end
end