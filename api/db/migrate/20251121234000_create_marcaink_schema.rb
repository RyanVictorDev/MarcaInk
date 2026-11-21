class CreateMarcainkSchema < ActiveRecord::Migration[8.1]
  def change
    create_table :studios do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.string :timezone, null: false, default: "America/Sao_Paulo"
      t.string :phone
      t.string :address
      t.string :instagram
      t.text :cancellation_policy
      t.integer :cancellation_hours, null: false, default: 24
      t.integer :buffer_minutes, null: false, default: 15
      t.integer :min_booking_hours, null: false, default: 24
      t.string :subscription_status, null: false, default: "trialing"
      t.string :plan, null: false, default: "solo"
      t.string :abacate_subscription_id
      t.datetime :trial_ends_at

      t.timestamps
    end
    add_index :studios, :slug, unique: true

    create_table :users do |t|
      t.references :studio, null: false, foreign_key: true
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name, null: false
      t.string :role, null: false, default: "artist"
      t.string :color, null: false, default: "#d97706"
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :users, [ :studio_id, :email ], unique: true

    create_table :services do |t|
      t.references :studio, null: false, foreign_key: true
      t.string :name, null: false
      t.string :kind, null: false, default: "session"
      t.integer :duration_minutes, null: false, default: 120
      t.integer :price_from_cents, null: false, default: 0
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    create_table :working_hours do |t|
      t.references :studio, null: false, foreign_key: true
      t.references :artist, null: true, foreign_key: { to_table: :users }
      t.integer :day_of_week, null: false
      t.time :opens_at, null: false
      t.time :closes_at, null: false

      t.timestamps
    end
    add_index :working_hours, [ :studio_id, :artist_id, :day_of_week ], unique: true, name: "index_working_hours_unique"

    create_table :blocks do |t|
      t.references :studio, null: false, foreign_key: true
      t.references :artist, null: false, foreign_key: { to_table: :users }
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :note

      t.timestamps
    end

    create_table :appointments do |t|
      t.references :studio, null: false, foreign_key: true
      t.references :artist, null: false, foreign_key: { to_table: :users }
      t.references :service, null: false, foreign_key: true
      t.string :customer_name, null: false
      t.string :customer_email, null: false
      t.string :customer_phone, null: false
      t.text :notes
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :status, null: false, default: "confirmed"
      t.string :source, null: false, default: "public"
      t.string :cancel_token, null: false

      t.timestamps
    end
    add_index :appointments, :cancel_token, unique: true
    add_index :appointments, [ :studio_id, :starts_at ]
    add_index :appointments, [ :artist_id, :starts_at ]

    create_table :abacate_webhook_events do |t|
      t.string :event_id, null: false
      t.string :event_type, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :processed_at

      t.timestamps
    end
    add_index :abacate_webhook_events, :event_id, unique: true
  end
end