module ContactValidation
  EMAIL_FORMAT = /\A[A-Z0-9._%+\-]+@[A-Z0-9](?:[A-Z0-9\-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9\-]*[A-Z0-9])?)+\z/i
  VALID_DDDS = %w[
    11 12 13 14 15 16 17 18 19
    21 22 24 27 28
    31 32 33 34 35 37 38
    41 42 43 44 45 46 47 48 49
    51 53 54 55
    61 62 63 64 65 66 67 68 69
    71 73 74 75 77 79
    81 82 83 84 85 86 87 88 89
    91 92 93 94 95 96 97 98 99
  ].freeze

  module_function

  def email?(value)
    value.to_s.match?(EMAIL_FORMAT)
  end

  def normalize_phone(value)
    digits = value.to_s.gsub(/\D/, "")
    digits = digits.sub(/\A55/, "") if digits.start_with?("55") && [ 12, 13 ].include?(digits.length)
    digits
  end

  def phone_error(value)
    digits = normalize_phone(value)
    return "não pode ficar em branco" if digits.blank?
    return "precisa ter DDD e 8 ou 9 dígitos" unless digits.match?(/\A\d{10,11}\z/)
    return "não parece um número real" if digits.chars.uniq.length == 1
    return "tem um DDD inválido" unless VALID_DDDS.include?(digits[0, 2])

    if digits.length == 11
      return "de celular precisa começar com 9 depois do DDD" unless digits[2] == "9"
    elsif !("2".."5").cover?(digits[2])
      return "fixo precisa ser válido depois do DDD"
    end

    nil
  end

  def person_name_error(value)
    name = value.to_s.strip.gsub(/\s+/, " ")
    return "não pode ficar em branco" if name.blank?
    return "está muito curto" if name.length < 5
    return "está muito longo" if name.length > 80
    return "deve conter apenas letras" unless name.match?(/\A[\p{L}][\p{L}'’.\- ]+\z/)

    parts = name.split
    return "precisa de nome e sobrenome" if parts.size < 2 || parts.none? { |part| part.length >= 2 }

    nil
  end

  def place_name_error(value)
    name = value.to_s.strip.gsub(/\s+/, " ")
    return "não pode ficar em branco" if name.blank?
    return "está muito curto" if name.length < 2
    return "está muito longo" if name.length > 80
    return "tem caracteres inválidos" unless name.match?(/\A[\p{L}0-9][\p{L}0-9 .&'’\-]{0,79}\z/)

    nil
  end
end
