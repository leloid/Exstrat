import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration de la validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans les DTOs
      forbidNonWhitelisted: true, // Rejette les requêtes avec des propriétés non autorisées
      transform: true, // Transforme automatiquement les types
      transformOptions: {
        enableImplicitConversion: true, // Conversion implicite des types
      },
    }),
  );

  // Configuration CORS
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.enableCors({
    origin: (origin, callback) => {
      // En développement : autoriser toutes les origines localhost
      if (!isProduction) {
        // Autoriser toutes les requêtes en développement
        return callback(null, true);
      }
      
      // En production : vérifier les origines autorisées
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://exstrat.com',
        'https://www.exstrat.com'
      ].filter(Boolean);
      
      // Autoriser les requêtes sans origin (ex: Postman, mobile apps) en production
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 200,
  });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('ExStrat API')
    .setDescription('API sécurisée pour la gestion des stratégies de trading crypto')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Entrez le token JWT obtenu lors de la connexion',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Endpoints d\'authentification sécurisée')
    .addTag('Health Check', 'Vérification de l\'état de l\'API et de la base de données')
    .addTag('Tokens', 'Recherche et informations sur les tokens crypto')
    .addTag('Transactions', 'Gestion des transactions et du portfolio')
    .addTag('Strategies', 'Gestion des stratégies de prise de profit')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Garde l'autorisation entre les recharges
      requestInterceptor: (req) => {
        console.log('🔍 [Swagger] Request:', req.url, req.headers);
        return req;
      },
      responseInterceptor: (res) => {
        console.log('🔍 [Swagger] Response:', res.status, res.url);
        return res;
      },
    },
    customSiteTitle: 'ExStrat API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
