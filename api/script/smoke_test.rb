# frozen_string_literal: true

# Run: bin/rails runner script/smoke_test.rb

abort "Precisa de studio demo" unless (studio = Studio.find_by(slug: "black-needle"))
artist = studio.artists.first
service = studio.services.active.first

slots = AvailabilityService.new(
  studio: studio, artist: artist, service: service,
  from_date: Date.current, to_date: Date.current + 7
).slots
abort "Sem slots" if slots.empty?

starts = Time.zone.parse(slots.last[:starts_at])
apt = BookingService.create_public!(
  studio: studio,
  artist: artist,
  service: service,
  starts_at: starts,
  attrs: {
    customer_name: "Smoke Test",
    customer_email: "smoke@test.local",
    customer_phone: "11999999999"
  }
)

begin
  BookingService.create_public!(
    studio: studio,
    artist: artist,
    service: service,
    starts_at: starts,
    attrs: {
      customer_name: "Dup",
      customer_email: "dup@test.local",
      customer_phone: "11999999999"
    }
  )
  abort "Esperava conflito no segundo booking"
rescue BookingService::SlotUnavailable
  puts "OK: double booking bloqueado"
end

token = apt.cancel_token
apt.update!(status: "confirmed", starts_at: 3.days.from_now)
# simulate idempotent cancel via model
apt.update!(status: "cancelled")
apt.update!(status: "cancelled")

evt = "smoke_evt_#{SecureRandom.hex(4)}"
2.times do
  AbacateWebhookEvent.transaction do
    ev = AbacateWebhookEvent.lock.find_by(event_id: evt)
    unless ev&.processed_at.present?
      ev ||= AbacateWebhookEvent.create!(event_id: evt, event_type: "test", payload: {})
      ev.update!(processed_at: Time.current)
    end
  end
end

puts "OK: smoke tests passed (appointment ##{apt.id})"