module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :authenticate!

      def index
        render json: {
          unread_count: current_user.notifications.unread.count,
          notifications: current_user.notifications.recent.includes(appointment: [ :service, :artist ]).limit(20).map { |note| notification_json(note) }
        }
      end

      def read
        note = current_user.notifications.find(params[:id])
        note.update!(read_at: Time.current) if note.read_at.nil?
        render json: { unread_count: current_user.notifications.unread.count }
      end

      def read_all
        current_user.notifications.unread.update_all(read_at: Time.current, updated_at: Time.current)
        render json: { unread_count: 0 }
      end

      private

      def notification_json(note)
        appointment = note.appointment
        {
          id: note.id,
          read: note.read_at.present?,
          created_at: note.created_at,
          customer_name: appointment.customer_name,
          service_name: appointment.service.name,
          artist_name: appointment.artist.name,
          for_you: note.user_id == appointment.artist_id,
          starts_at: appointment.starts_at
        }
      end
    end
  end
end