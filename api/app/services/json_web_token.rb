class JsonWebToken
  EXPIRY = 14.days

  def self.encode(user_id)
    payload = { sub: user_id, exp: EXPIRY.from_now.to_i }
    JWT.encode(payload, secret, "HS256")
  end

  def self.decode(token)
    body = JWT.decode(token, secret, true, algorithm: "HS256").first
    User.find(body["sub"])
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    nil
  end

  def self.secret
    ENV["JWT_SECRET"].presence || Rails.application.secret_key_base
  end
end