if Rails.env.development? && Studio.none?
  studio = Studio.create!(
    name: "Black Needle Studio",
    slug: "black-needle",
    phone: "(11) 98765-4321",
    address: "Rua das Artes, 128 — Vila Madalena, São Paulo",
    instagram: "@blackneedle.ink",
    cancellation_policy: "Cancelamentos com pelo menos 24h de antecedência.",
    subscription_status: "trialing",
    trial_ends_at: 30.days.from_now,
    min_booking_hours: 1
  )

  owner = studio.users.create!(
    name: "Ryan Demo",
    email: "demo@marcaink.app",
    password: "demo12345",
    role: "owner",
    color: "#ea580c"
  )

  artist = studio.users.create!(
    name: "Luna Ink",
    email: "luna@blackneedle.local",
    password: SecureRandom.hex(12),
    role: "artist",
    color: "#f59e0b"
  )

  studio.services.create!([
    { name: "Consulta de projeto", kind: "consultation", duration_minutes: 60, price_from_cents: 0 },
    { name: "Sessão — braço (até 3h)", kind: "session", duration_minutes: 180, price_from_cents: 450_00 },
    { name: "Retoque gratuito (30 dias)", kind: "touch_up", duration_minutes: 60, price_from_cents: 0 }
  ])

  (1..6).each do |dow|
    next if dow.zero?
    studio.working_hours.create!(artist: artist, day_of_week: dow, opens_at: "11:00", closes_at: "20:00")
  end

  puts "Demo: demo@marcaink.app / demo12345 — slug: black-needle"
end