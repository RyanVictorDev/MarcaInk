# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_11_21_234000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "abacate_webhook_events", force: :cascade do |t|
    t.string "event_id", null: false
    t.string "event_type", null: false
    t.jsonb "payload", default: {}, null: false
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_abacate_webhook_events_on_event_id", unique: true
  end

  create_table "appointments", force: :cascade do |t|
    t.bigint "studio_id", null: false
    t.bigint "artist_id", null: false
    t.bigint "service_id", null: false
    t.string "customer_name", null: false
    t.string "customer_email", null: false
    t.string "customer_phone", null: false
    t.text "notes"
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.string "status", default: "confirmed", null: false
    t.string "source", default: "public", null: false
    t.string "cancel_token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["artist_id", "starts_at"], name: "index_appointments_on_artist_id_and_starts_at"
    t.index ["artist_id"], name: "index_appointments_on_artist_id"
    t.index ["cancel_token"], name: "index_appointments_on_cancel_token", unique: true
    t.index ["service_id"], name: "index_appointments_on_service_id"
    t.index ["studio_id", "starts_at"], name: "index_appointments_on_studio_id_and_starts_at"
    t.index ["studio_id"], name: "index_appointments_on_studio_id"
  end

  create_table "blocks", force: :cascade do |t|
    t.bigint "studio_id", null: false
    t.bigint "artist_id", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.string "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["artist_id"], name: "index_blocks_on_artist_id"
    t.index ["studio_id"], name: "index_blocks_on_studio_id"
  end

  create_table "services", force: :cascade do |t|
    t.bigint "studio_id", null: false
    t.string "name", null: false
    t.string "kind", default: "session", null: false
    t.integer "duration_minutes", default: 120, null: false
    t.integer "price_from_cents", default: 0, null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["studio_id"], name: "index_services_on_studio_id"
  end

  create_table "studios", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.string "timezone", default: "America/Sao_Paulo", null: false
    t.string "phone"
    t.string "address"
    t.string "instagram"
    t.text "cancellation_policy"
    t.integer "cancellation_hours", default: 24, null: false
    t.integer "buffer_minutes", default: 15, null: false
    t.integer "min_booking_hours", default: 24, null: false
    t.string "subscription_status", default: "trialing", null: false
    t.string "plan", default: "solo", null: false
    t.string "abacate_subscription_id"
    t.datetime "trial_ends_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_studios_on_slug", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.bigint "studio_id", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name", null: false
    t.string "role", default: "artist", null: false
    t.string "color", default: "#d97706", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["studio_id", "email"], name: "index_users_on_studio_id_and_email", unique: true
    t.index ["studio_id"], name: "index_users_on_studio_id"
  end

  create_table "working_hours", force: :cascade do |t|
    t.bigint "studio_id", null: false
    t.bigint "artist_id"
    t.integer "day_of_week", null: false
    t.time "opens_at", null: false
    t.time "closes_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["artist_id"], name: "index_working_hours_on_artist_id"
    t.index ["studio_id", "artist_id", "day_of_week"], name: "index_working_hours_unique", unique: true
    t.index ["studio_id"], name: "index_working_hours_on_studio_id"
  end

  add_foreign_key "appointments", "services"
  add_foreign_key "appointments", "studios"
  add_foreign_key "appointments", "users", column: "artist_id"
  add_foreign_key "blocks", "studios"
  add_foreign_key "blocks", "users", column: "artist_id"
  add_foreign_key "services", "studios"
  add_foreign_key "users", "studios"
  add_foreign_key "working_hours", "studios"
  add_foreign_key "working_hours", "users", column: "artist_id"
end
