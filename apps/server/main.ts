import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** Webhooks Whats2 podem incluir mídia/base64; o padrão do Express (~100kb) gera PayloadTooLargeError. */
const JSON_BODY_LIMIT = process.env.HTTP_JSON_BODY_LIMIT ?? '25mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { extended: true, limit: JSON_BODY_LIMIT });

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-tenant-schema',
      'ngrok-skip-browser-warning',
    ],
    credentials: true,
  });

  // Configurar prefixo global da API
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicação rodando na porta ${port}`);
}
bootstrap();






