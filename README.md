# 🍔 Burger App

Sistema completo de hamburgueria com painel admin, portal do motoqueiro e app do cliente.

## Stack

- **Next.js 14** — App Router + TypeScript
- **PostgreSQL** — Supabase
- **Prisma** — ORM
- **NextAuth v5** — Autenticação
- **Stripe** — Pagamentos
- **Pusher** — Tempo real
- **Resend** — E-mails
- **Tailwind CSS + shadcn/ui** — Interface

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Stripe](https://stripe.com)
- Conta no [Pusher](https://pusher.com)
- Conta no [Resend](https://resend.com)

## Instalação

### 1. Clone e instale as dependências

\`\`\`bash
git clone <seu-repo>
cd burger-app
npm install
\`\`\`

### 2. Configure as variáveis de ambiente

\`\`\`bash
cp .env.example .env
\`\`\`

Preencha todas as variáveis no `.env` com suas chaves.

### 3. Gere o NEXTAUTH_SECRET

\`\`\`bash
openssl rand -base64 32
\`\`\`

Cole o resultado no `.env` em `NEXTAUTH_SECRET`.

### 4. Configure o banco de dados

No painel do Supabase, vá em **SQL Editor** e rode o SQL gerado por:

\`\`\`bash
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
\`\`\`

Depois rode:

\`\`\`bash
npx prisma generate
\`\`\`

### 5. Crie o primeiro admin

No **SQL Editor** do Supabase, rode:

\`\`\`sql
INSERT INTO users (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
gen_random_uuid(),
'Seu Nome',
'admin@email.com',
'$2b$10$HASH_DA_SENHA_AQUI',
'ADMIN',
now(),
now()
);
\`\`\`

Para gerar o hash da senha, rode no terminal:

\`\`\`bash
node -e "const b = require('bcryptjs'); b.hash('suasenha', 10).then(console.log)"
\`\`\`

### 6. Configure o webhook do Stripe

Instale o Stripe CLI:
\`\`\`bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
\`\`\`

Copie o `STRIPE_WEBHOOK_SECRET` que aparecer e cole no `.env`.

### 7. Configure as chaves do Stripe

No painel do Stripe em **Developers → API Keys** copie:

- `STRIPE_SECRET_KEY` → chave secreta
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → chave publicável

### 8. Configure o Pusher

No painel do Pusher crie um app e copie:

- `PUSHER_APP_ID`
- `PUSHER_KEY`
- `PUSHER_SECRET`
- `PUSHER_CLUSTER`

### 9. Configure o Resend

No painel do Resend crie uma API key e cole em `RESEND_API_KEY`.
Coloque seu e-mail em `ADMIN_EMAIL`.

### 10. Rode o projeto

\`\`\`bash
npm run dev
\`\`\`

Acesse [http://localhost:3000](http://localhost:3000)

## URLs do sistema

| URL                | Descrição              |
| ------------------ | ---------------------- |
| `/`                | Cardápio do cliente    |
| `/login`           | Login                  |
| `/register`        | Cadastro de cliente    |
| `/orders`          | Pedidos do cliente     |
| `/rewards`         | Recompensas do cliente |
| `/admin/dashboard` | Painel admin           |
| `/admin/orders`    | Gerenciar pedidos      |
| `/admin/menu`      | Gerenciar cardápio     |
| `/admin/loyalty`   | Regras de fidelidade   |
| `/courier`         | Portal do motoqueiro   |

## Deploy na Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

Adicione todas as variáveis do `.env` no painel da Vercel em **Settings → Environment Variables**.

Para o webhook do Stripe em produção, registre a URL:
\`\`\`
https://seudominio.com/api/webhooks/stripe
\`\`\`
