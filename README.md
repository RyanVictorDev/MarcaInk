# MarcaInk

SaaS de agendamento para estúdios de tatuagem — painel do dono, fluxo público do cliente e assinatura com **AbacatePay**.

## Stack

| Parte | Tecnologia |
|-------|------------|
| API | Ruby on Rails 8 (API-only), PostgreSQL |
| Web | Next.js 15, Tailwind CSS 4, TypeScript |

## Rodar localmente

### 1. Banco

```bash
# PostgreSQL com usuário marcaink / marcaink (ou ajuste api/config/database.yml)
createdb marcaink_development -O marcaink
```

### 2. API (porta 3041)

```bash
cd api
bundle config set --local path 'vendor/bundle'
bundle install
bin/rails db:migrate db:seed
bin/rails server -p 3041 -b 127.0.0.1
```

### 3. Frontend (porta 3042)

```bash
cd web
npm install
npm run dev
```

Abra [http://127.0.0.1:3042](http://127.0.0.1:3042).

**Conta demo:** `demo@marcaink.app` / `demo12345`  
**Agenda pública:** `/s/black-needle`

## AbacatePay

- Webhook: `POST /webhooks/abacate`
- Checkout: `POST /api/v1/billing/checkout` (com JWT)
- Sem `ABACATEPAY_API_KEY`, o billing ativa em **modo demonstração** para desenvolvimento.

Variáveis sugeridas (produção):

```bash
ABACATEPAY_API_KEY=
ABACATEPAY_CHECKOUT_URL=
JWT_SECRET=
CORS_ORIGINS=https://seu-dominio.com
```

## Licença

MIT