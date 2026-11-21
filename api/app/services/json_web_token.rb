class JsonWebToken
  SECRET = ENV.fetch("JWT_SECRET") { Rails.application.credentials.secret_key_base }
  EXPIRY = 14.days

  def self.encode(user_id)
    payload = { sub: user_id, exp: EXPIRY.from_now.to_i }
    JWT.encode(payload, SECRET, "HS256")
  end

  def self.decode(token)
    body = JWT.decode(token, SECRET, true, algorithm: "HS256").first
    User.find(body["sub"])
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    nil
  end
end