Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      get "auth/me", to: "auth#me"

      resource :dashboard, only: [ :show ], controller: "dashboard"
      resource :studio, only: [ :show, :update ]
      resources :services, except: [ :show ]
      resources :artists, only: [ :index, :create, :update ]
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