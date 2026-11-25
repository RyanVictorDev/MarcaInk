class BookingNotifier
  def self.call(appointment)
    studio = appointment.studio
    artist = appointment.artist
    recipients = studio.users.where(role: "owner", active: true).to_a
    recipients << artist if artist&.active?
    recipients.uniq(&:id).each do |user|
      Notification.create!(
        studio: studio,
        user: user,
        appointment: appointment,
        kind: "booking"
      )
    end
  rescue StandardError => error
    Rails.logger.error("Falha ao avisar a equipe sobre a marcação #{appointment.id}: #{error.class}: #{error.message}")
  end
end