Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      post "auth/login/studio", to: "auth#choose_studio"
      post "auth/password/forgot", to: "passwords#forgot"
      get "auth/password/reset", to: "passwords#show"
      post "auth/password/reset", to: "passwords#update"
      get "auth/me", to: "auth#me"

      resource :dashboard, only: [ :show ], controller: "dashboard"
      resource :studio, only: [ :show, :update ]
      resource :schedule, only: [ :show, :update ], controller: "schedule"
      resources :closed_days, only: [ :create, :destroy ]
      resources :services, except: [ :show ]
      resources :artists, only: [ :index, :create, :update, :destroy ]
      resources :appointments, only: [ :index, :create, :update ]
      post "billing/checkout", to: "billing#checkout"

      namespace :public do
        get "studios/:slug", to: "studios#show"
        get "studios/:slug/slots", to: "studios#slots"
        post "studios/:slug/book", to: "studios#book"
        post "bookings/cancel/:token", to: "studios#cancel"
      end
    end
  end

  namespace :webhooks do
    post "abacate", to: "abacate#create"
  end
end