class Studio < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :services, dependent: :destroy
  has_many :working_hours, dependent: :destroy
  has_many :blocks, dependent: :destroy
  has_many :appointments, dependent: :destroy

  validates :name, :slug, presence: true
  validates :slug, uniqueness: true, format: { with: /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/ }

  before_validation :normalize_slug

  def subscription_active?
    %w[active trialing].include?(subscription_status) &&
      (subscription_status != "trialing" || trial_ends_at.nil? || trial_ends_at > Time.current)
  end

  def artists
    users.where(role: "artist", active: true)
  end

  private

  def normalize_slug
    self.slug = slug.to_s.downcase.strip.gsub(/[^a-z0-9-]/, "-").squeeze("-").gsub(/\A-|-\z/, "") if slug.present?
  end
end