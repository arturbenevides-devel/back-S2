import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

const JSON_BODY_LIMIT = process.env.HTTP_JSON_BODY_LIMIT ?? '25mb';
const isProduction = process.env.NODE_ENV === 'production';

function resolveCorsOrigin():
  | boolean
  | ((
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void) {
  if (!isProduction) {
    return true;
  }
  const extra = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const front = process.env.FRONTEND_URL?.trim();
  const allowed = [...new Set([...extra, ...(front ? [front] : [])])];
  if (allowed.length === 0) {
    return true;
  }
  return (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    cb(null, allowed.includes(origin));
  };
}

function assertProductionJwtSecret(): void {
  if (!isProduction) {
    return;
  }
  const s = process.env.JWT_SECRET;
  if (!s || s === 'your-super-secret-jwt-key-here') {
    throw new Error(
      'Em NODE_ENV=production defina JWT_SECRET com um valor forte (não use o placeholder padrão).',
    );
  }
}

async function bootstrap() {
  assertProductionJwtSecret();

  const logLevels: LogLevel[] = isProduction
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logLevels,
  });
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: JSON_BODY_LIMIT });

  const corsAllowedHeaders = [
    'Content-Type',
    'Authorization',
    'Accept',
    'x-tenant-schema',
    ...(isProduction ? [] : ['ngrok-skip-browser-warning']),
  ];

  app.enableCors({
    origin: resolveCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: corsAllowedHeaders,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Agente Mais API')
      .setDescription('API para sistema Agente Mais com arquitetura DDD')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Digite o token JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Endpoints de autenticação')
      .addTag('users', 'Gerenciamento de usuários')
      .addTag('profiles', 'Gerenciamento de perfis')
      .addTag('Menus', 'Gerenciamento de menus')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicação rodando na porta ${port}`);
}
bootstrap();
