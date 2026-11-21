Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      ENV.fetch("CORS_ORIGINS", "http://localhost:3042,http://127.0.0.1:3042").split(",")
    )

    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: [ "Authorization" ],
      credentials: false
  end
end