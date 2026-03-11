# 🏗️ Jornada de Vendas API

API RESTful para o sistema Jornada de Vendas desenvolvida com **Node.js**, **NestJS**, **TypeScript** e **Prisma ORM** em arquitetura **Monorepo**.

## 🏛️ Arquitetura Monorepo

Aplicação organizada em monorepo seguindo **Domain-Driven Design (DDD)**:

```
sales-journey-api/
├── apps/                    # Aplicações
│   ├── core/               # Biblioteca core com regras de negócio
│   │   └── application/    # Módulos de aplicação (users, profiles, menus, auth)
│   └── server/             # Aplicação servidor principal
├── common/                 # Módulos compartilhados
│   ├── database/           # Persistência (Prisma)
│   ├── domain/             # Entidades de domínio
│   ├── email/              # Serviços de email
│   ├── http/               # Controllers e guards
│   └── utils/              # Utilitários compartilhados
└── prisma/                 # Schema e seeds do banco
```

## 🚀 Tecnologias

- **Node.js** 22.x LTS
- **NestJS** 10.x
- **TypeScript** 5.9.x
- **Prisma ORM** 6.x
- **PostgreSQL** 17.x
- **JWT** para autenticação
- **Swagger** para documentação da API

## ⚙️ Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
Crie o arquivo `.env` na raiz do projeto:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=development
TZ=America/Sao_Paulo

# Email Configuration (opcional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASS="sua-senha-de-app"
EMAIL_FROM="JORNADA VENDAS <noreply@develcode.com.br>"
FRONTEND_URL="https://jornada-vendas-dev.develcode.com.br"
```

### 3. Executar Migrações e Seed
```bash
npm run prisma:setup
```

### 4. Iniciar Aplicação
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000/api/v1` e a documentação Swagger em `http://localhost:3000/api`.

## 🔐 Sistema de Autenticação e Autorização

### Autenticação JWT
- **Login**: `POST /api/v1/auth/login` (público)
- **Token**: JWT com expiração configurável
- **Headers**: `Authorization: Bearer <token>`

### Sistema de Permissões
- **Perfis**: Cada usuário possui um perfil com permissões específicas
- **Permissões**: Controle granular por controller e ação (create, update, delete, find, findAll)
- **Menus**: Sistema de menus com permissões específicas por usuário
- **Admin**: Perfil `isDefault = true` tem acesso total (bypass de permissões)

### Endpoints Públicos
- `POST /api/v1/users` - Criar usuário
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/users/confirm-email?token={token}` - Confirmar email

### Endpoints Protegidos
Todos os outros endpoints requerem token JWT válido e permissões adequadas.

## 📋 Sistema de Menus

### Funcionalidades
- **Menus Dinâmicos**: Sistema de menus baseado em permissões do usuário
- **Tipos de Menu**: 
  - `ROOT_MENU`: Menus principais (Início, Logout) - não precisam de permissões
  - `CUSTOM_MENU`: Menus personalizados - precisam de permissões específicas
- **Dispositivos**: Suporte para DESKTOP e MOBILE
- **Permissões**: Cada menu retorna as permissões específicas do usuário

### Endpoints de Menus
- `GET /api/v1/menu/authorized/:deviceType` - Buscar menus autorizados (todos os usuários)
- `POST /api/v1/menu` - Criar menu (apenas admin, não aparece no Swagger)

### Estrutura de Resposta
```json
[
  {
    "id": "uuid-do-menu",
    "action": "/users",
    "deviceType": "DESKTOP",
    "displayOrder": 1,
    "icon": "FaUser",
    "name": "Usuários",
    "sectionName": null,
    "tooltip": null,
    "type": "CUSTOM_MENU",
    "permissions": {
      "canCreate": true,
      "canUpdate": false,
      "canDelete": false,
      "canFind": true,
      "canFindAll": false
    }
  }
]
```

## 🎯 Configuração de Permissões por Endpoint

### Decorator @AccessControl
```typescript
@AccessControl({ permissions: { find: true } })     // Permite busca individual
@AccessControl({ permissions: { findAll: true } })  // Permite listagem
@AccessControl({ permissions: { create: true } })   // Permite criação
@AccessControl({ permissions: { update: true } })   // Permite atualização
@AccessControl({ permissions: { delete: true } })   // Permite exclusão
```

### Decorator @AdminOnly
```typescript
@AdminOnly()  // Apenas perfil admin (isDefault = true) pode acessar
```

### Exemplo de Uso
```typescript
@Controller('profiles')
export class ProfilesController {
  @Post()
  @AccessControl({ permissions: { create: true } })  // Verifica permissão no banco
  create(@Body() createProfileDto: CreateProfileDto) {
    // ...
  }

  @Get()
  @AccessControl({ permissions: { findAll: true } })  // Verifica permissão no banco
  findAll() {
    // ...
  }

  @Get(':id')
  @AccessControl({ permissions: { find: true } })  // Verifica permissão no banco
  findOne(@Param('id') id: string) {
    // ...
  }

  @Put(':id')
  @AccessControl({ permissions: { update: true } })  // Verifica permissão no banco
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    // ...
  }

  @Delete(':id')
  @AccessControl({ permissions: { delete: true } })  // Verifica permissão no banco
  remove(@Param('id') id: string) {
    // ...
  }
}

@Controller('users')
export class UsersController {
  @Get()
  @AccessControl({ permissions: { findAll: true } })  // Verifica permissão no banco
  findAll() {
    // ...
  }

  @Get(':id')
  @AccessControl({ permissions: { find: true } })  // Verifica permissão no banco
  findOne(@Param('id') id: string) {
    // ...
  }

  @Put(':id')
  @AccessControl({ permissions: { update: true } })  // Verifica permissão no banco
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // ...
  }

  @Delete(':id')
  @AccessControl({ permissions: { delete: true } })  // Verifica permissão no banco
  remove(@Param('id') id: string) {
    // ...
  }
}

@Controller('menu')
export class MenusController {
  @Get('authorized/:deviceType')
  // Sem @AccessControl - todos os usuários autenticados podem acessar
  getAuthorizedMenus(@Param('deviceType') deviceType: DeviceType) {
    // ...
  }

  @Post()
  @AdminOnly()  // Apenas admin pode criar menus
  @ApiExcludeEndpoint()  // Não aparece no Swagger
  createMenu(@Body() createMenuDto: CreateMenuDto) {
    // ...
  }
}
```

### Regras de Permissão
- **Perfil Admin (`isDefault = true`)**: Acesso total, bypass de todas as verificações
- **Outros Perfis**: Verificação baseada na tabela `profile_permissions`
- **Sem Permissão**: Retorna 403 "Acesso Negado"
- **Menus ROOT_MENU**: Sempre retornam `permissions: null`
- **Menus CUSTOM_MENU**: Retornam permissões específicas do usuário ou `null` se não existir

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run start:dev          # Iniciar em modo desenvolvimento
npm run build              # Compilar TypeScript completo
npm run build:core         # Compilar apenas core
npm run build:server       # Compilar apenas server
npm run start:prod         # Iniciar em modo produção

# Banco de Dados
npm run prisma:generate    # Gerar cliente Prisma
npm run prisma:deploy      # Executar migrações
npm run prisma:studio      # Interface visual do banco
npm run prisma:reset       # Resetar banco e executar seed
npm run prisma:setup       # Migrar + seed (setup completo)

# Testes
npm run test               # Executar testes
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com cobertura
```

## 🔒 Regras Importantes

### Perfis e Permissões
- **Perfil Administrador (`isDefault = true`)**: Criado apenas via seed, não precisa de permissões específicas, tem acesso total
- **Outros Perfis (`isDefault = false`)**: Criados via API, sempre com `isDefault = false`, DEVEM ter permissões criadas na tabela `profile_permissions`
- **Campo isDefault**: Não aceito no DTO de criação, sempre será `false` para perfis criados via API
- **Sem permissões**: Perfis não-admin sem permissões terão acesso negado (403)
- **Soft Delete**: Operações de delete apenas desativam registros (`isActive = false`), não os removem do banco
- **Filtros Ativos**: `findAll` e `findById` retornam apenas registros com `isActive = true`

### Sistema de Menus
- **Criação de Menus**: Apenas usuários admin podem criar menus
- **Dispositivos**: Ao criar um menu sem especificar `deviceType`, são criados automaticamente para DESKTOP e MOBILE
- **Permissões de Menu**: Cada perfil deve ter permissões específicas para cada menu CUSTOM_MENU
- **Controller Automático**: O campo `controller` é derivado automaticamente do `action` do menu (removendo a `/` inicial)
- **Upsert de Permissões**: Ao criar/atualizar perfil, as permissões são upsert (atualiza se existe, cria se não existe)

### Estrutura de Dados
- **Menus**: Tabela `menus` com campos `action`, `deviceType`, `displayOrder`, `icon`, `name`, `sectionName`, `tooltip`, `type`
- **Profile Permissions**: Tabela `profile_permissions` com `menuId` obrigatório para permissões de menu
- **Relacionamentos**: Menu → ProfilePermissions (1:N), Profile → ProfilePermissions (1:N)
