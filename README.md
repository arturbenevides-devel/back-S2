# Jornada de Vendas API

API REST para o sistema Jornada de Vendas com NestJS + Prisma + PostgreSQL.

## Arquitetura

Projeto em monorepo com DDD:

```text
apps/
  core/      regras de negócio
  server/    bootstrap da API
common/
  database/  prisma service e repositórios
  domain/    entidades e contratos
  http/      controllers e guards
  tenant/    infraestrutura multi-tenant
prisma/
  schema.prisma
  migrations/
```

## Multi-tenant (PostgreSQL por schema)

- Cada empresa usa um schema próprio no Postgres.
- O nome do schema é o CNPJ com 14 dígitos (somente números).
- Existe um registro central em `public.tenant_registry`.
- O login inclui `cnpj`; o JWT inclui `tenantSchema`.
- Em requests autenticadas, o backend lê `tenantSchema` do token e executa queries no schema do tenant.

## Pré-requisitos

- Node.js 22+
- PostgreSQL 17+

## Configuração

Crie um `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=development
TZ=America/Sao_Paulo

EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASS="sua-senha-de-app"
EMAIL_FROM="Develcode Whitelabel"
FRONTEND_URL="https://jornada-vendas-dev.develcode.com.br"
```

## Instalação

```bash
npm install
```

## Banco de dados

1) Aplicar migrations no `public`:

```bash
npm run prisma:deploy
```

2) Aplicar migrations em todos os tenants já cadastrados:

```bash
npm run tenants:migrate
```

3) Seed (SaaS): percorre todos os registros de `public.tenant_registry` e, em cada schema, garante os menus padrão se ainda não existir nenhum. Se não houver tenant cadastrado, não faz nada além de logar instrução.

```bash
npm run prisma:seed
```

## Executar API

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api`

## Fluxo de autenticação multi-tenant

### Cadastro de tenant

`POST /api/v1/auth/register-tenant`

Body:

```json
{
  "cnpj": "12.345.678/0001-90",
  "companyName": "Empresa Exemplo LTDA",
  "fullName": "Admin Empresa",
  "email": "admin@empresa.com.br",
  "password": "senha123"
}
```

Processo:

- Normaliza CNPJ para 14 dígitos.
- Valida se schema/tenant já existe.
- Cria schema do tenant.
- Aplica migrations do tenant.
- Cria dados iniciais (perfil admin, empresa, menus e usuário admin).
- Registra em `public.tenant_registry`.

### Login

`POST /api/v1/auth/login`

Body:

```json
{
  "cnpj": "12345678000190",
  "email": "admin@empresa.com.br",
  "password": "senha123"
}
```

Retorno:

- JWT com `tenantSchema` no payload.

### Endpoints públicos que exigem CNPJ

- `POST /api/v1/auth/validate-reset-token/:token?cnpj={cnpj}`
- `GET /api/v1/users/confirm-email?token={token}&cnpj={cnpj}`
- `POST /api/v1/auth/first-access` (campo `cnpj` no body)
- `POST /api/v1/auth/change-password` (campo `cnpj` no body)

## Endpoints protegidos

Todos os endpoints protegidos exigem:

- `Authorization: Bearer <token>`
- Token válido com `tenantSchema`

## Scripts úteis

```bash
# app
npm run start:dev
npm run build
npm run start:prod

# banco
npm run prisma:generate
npm run prisma:deploy
npm run prisma:reset
npm run prisma:seed
npm run tenants:migrate

# testes
npm run test
npm run test:watch
npm run test:cov
```
