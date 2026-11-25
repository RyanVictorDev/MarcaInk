class JsonWebToken
  EXPIRY = 14.days

  def self.encode(user_id)
    payload = { sub: user_id, exp: EXPIRY.from_now.to_i }
    JWT.encode(payload, secret, "HS256")
  end

  def self.decode(token)
    body = JWT.decode(token, secret, true, algorithm: "HS256").first
    return nil if body["purpose"].present? || body["sub"].blank?

    User.find(body["sub"])
  rescue JWT::DecodeError, ActiveRecord::RecordNotFound
    nil
  end

  def self.encode_choice(user_ids)
    payload = { purpose: "studio_choice", users: user_ids, exp: 5.minutes.from_now.to_i }
    JWT.encode(payload, secret, "HS256")
  end

  def self.decode_choice(token)
    body = JWT.decode(token, secret, true, algorithm: "HS256").first
    return [] unless body["purpose"] == "studio_choice"

    Array(body["users"]).map(&:to_i).uniq
  rescue JWT::DecodeError
    []
  end

  def self.secret
    ENV["JWT_SECRET"].presence || Rails.application.secret_key_base
  end
end