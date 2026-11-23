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

### Docker

Sobe Postgres, API e frontend juntos. Senha, segredo e portas ficam no `.env`.

```bash
copy .env.example .env
docker compose up --build
```

No PowerShell, `copy .env.example .env`. No terminal Unix, `cp .env.example .env`. Troque `POSTGRES_PASSWORD` e `JWT_SECRET` antes de subir. A porta do banco no computador vem de `DB_PORT` (5433 por padrão, para não bater com um Postgres local na 5432).

O site fica em [http://127.0.0.1:3042](http://127.0.0.1:3042) e a API em [http://127.0.0.1:3041](http://127.0.0.1:3041).

**Conta demo:** `demo@marcaink.app` / `demo12345`  
**Agenda pública:** `/s/black-needle`

## AbacatePay

- Webhook: `POST /webhooks/abacate`
- Checkout: `POST /api/v1/billing/checkout` (com JWT)
- Sem `ABACATEPAY_API_KEY`, o billing ativa em **modo demonstração** para desenvolvimento.

As variáveis ficam no `.env`. O modelo está em `.env.example`.

## Licença

MIT