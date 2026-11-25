class IndexAppointmentsForAgenda < ActiveRecord::Migration[8.1]
  def change
    add_index :appointments, [ :studio_id, :status, :starts_at ], name: "index_appointments_on_studio_status_starts"
  end
end