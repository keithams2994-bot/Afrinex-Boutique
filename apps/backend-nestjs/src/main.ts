import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // rawBody activé pour la validation cryptographique des signatures Stripe
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Préfixe universel
  app.setGlobalPrefix('v1');

  // Sécurité CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, x-tenant-id, stripe-signature',
  });

  // Validation stricte des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 API Boutique Pro SaaS démarrée avec succès sur le port ${port} [v1]`);
}
bootstrap();
