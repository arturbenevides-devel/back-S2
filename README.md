# Agente Mais API

API REST para o sistema Agente Mais com NestJS + Prisma + PostgreSQL.

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
  migrations/          migrations Prisma (histórico + limpeza do public)
  tenant-migrations/   SQL aplicado só nos schemas de tenant (CNPJ)
```

## Multi-tenant (PostgreSQL por schema)

- Cada empresa usa um schema próprio no Postgres.
- O nome do schema é o CNPJ com 14 dígitos (somente números).
- Em `public` ficam apenas: `tenant_registry`, `tenant_migration_log` (controle de qual SQL já rodou em cada tenant) e `_prisma_migrations` (tabela interna do Prisma Migrate — não remover).
- O DDL de domínio (`companies`, `users`, etc.) existe só dentro de cada schema de tenant; os arquivos ficam em `prisma/tenant-migrations/`.
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
FRONTEND_URL="https://agente-mais.develcode.com.br"
```

## Instalação

```bash
npm install
```

## Banco de dados

1) Aplicar a migration Prisma em `public` (só `tenant_registry`, `tenant_migration_log` e `_prisma_migrations`):

```bash
npm run prisma:deploy
```

2) Aplicar o conteúdo de `prisma/tenant-migrations/*` em cada schema listado em `tenant_registry`:

```bash
npm run tenants:migrate
```

Ordem: **`prisma:deploy` antes de `tenants:migrate`**.

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

## Azure Web App (App Service)

### Comando de inicialização (Startup Command)

No portal: **Configuração** → **Configurações gerais** → **Comando de Inicialização**, use:

```bash
npm run start:prod
```

Equivalente direto:

```bash
node dist/apps/server/main
```

Defina também **PORT** nas configurações da aplicação: o App Service injeta `PORT` (em geral `8080`). A API deve escutar `process.env.PORT` (já é o padrão do Nest com `main.ts` usando `process.env.PORT || 3000`).

### Variáveis de ambiente (Application settings)

Configure pelo menos: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV=production`, e as variáveis de e-mail / `FRONTEND_URL` conforme o ambiente.

O pipeline deste repositório usa `SCM_DO_BUILD_DURING_DEPLOYMENT=true` e `WEBSITE_NODE_DEFAULT_VERSION=~20`: na implantação o Oryx executa `npm install` no pacote publicado (com `package.json`, `package-lock.json`, `dist/` e `prisma/`).

### Migrations e tenants (recomendado no pipeline, não no startup)

Rodar `prisma migrate deploy` e `tenants:migrate` a **cada subida do container** pode causar lentidão, corrida entre instâncias e falhas intermitentes. O ideal é executar no **Azure DevOps** (ou etapa de release) em um job que tenha **acesso de rede ao PostgreSQL**, usando o mesmo `DATABASE_URL`:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run tenants:migrate
```

Ordem típica no release: **build do artefato** → **migrations + tenants:migrate** (com `DATABASE_URL` do Key Vault / variável do pipeline) → **deploy do zip no Web App** → o Web App só sobe a API com **`npm run start:prod`**.

Se ainda não houver nenhum tenant em `tenant_registry`, `npm run tenants:migrate` não aplica nada nos schemas de tenant e pode ser executado assim mesmo.

## Fluxo de autenticação multi-tenant

### Cadastro de tenant

`POST /api/v1/auth/register-tenant`

Body:

```json
{
  "cnpj": "11.222.333/0001-81",
  "companyName": "Empresa Exemplo LTDA",
  "fullName": "Admin Empresa",
  "email": "admin@empresa.com.br",
  "password": "senha123"
}
```

Processo:

- Normaliza CNPJ para 14 dígitos e valida dígitos verificadores (CNPJ inválido retorna 400).
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
  "cnpj": "11222333000181",
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
