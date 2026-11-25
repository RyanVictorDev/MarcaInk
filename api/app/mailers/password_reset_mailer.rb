class PasswordResetMailer < ApplicationMailer
  def reset_links(email, links)
    @links = links
    mail(
      to: email,
      from: ENV["MAIL_FROM"].presence || "MarcaInk <nao-responda@marcaink.app>",
      subject: "Crie uma senha nova no MarcaInk"
    )
  end
end
