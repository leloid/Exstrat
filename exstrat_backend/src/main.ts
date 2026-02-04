import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

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
      skipMissingProperties: false, // Ne pas sauter les propriétés manquantes
      skipNullProperties: false, // Ne pas sauter les propriétés null
      skipUndefinedProperties: true, // Sauter les propriétés undefined (pour les mises à jour partielles)
      exceptionFactory: (errors) => {
        console.error('❌ [ValidationPipe] Validation errors:', JSON.stringify(errors, null, 2));
        return new BadRequestException({
          message: 'Validation failed',
          errors: errors,
        });
      },
    }),
  );

  // Ajouter le filter pour logger les erreurs de validation
  app.useGlobalFilters(new ValidationExceptionFilter());

  // Configuration CORS
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Liste des origines autorisées en production
  const productionOrigins = [
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL, // Pour Swagger et tests
    'https://exstrat.vercel.app',
    'https://exstrat.com',
    'https://www.exstrat.com',
    'http://localhost:3001', // Pour tester en local avec backend sur Railway
    'http://localhost:3000',
  ].filter(Boolean); // Retire les valeurs null/undefined
  
  app.enableCors({
    origin: (origin, callback) => {
      // En développement : autoriser toutes les origines
      if (!isProduction) {
        return callback(null, true);
      }
      
      // En production : 
      // - Autoriser les requêtes sans origin (ex: Postman, curl, mobile apps)
      if (!origin) {
        return callback(null, true);
      }
      
      // - Autoriser si l'origine est dans la liste autorisée
      if (productionOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // - Log pour debug (en production sur Railway)
      console.log(`🚫 CORS bloqué pour l'origine: ${origin}`);
      console.log(`✅ Origines autorisées: ${productionOrigins.join(', ')}`);
      console.log(`🌍 FRONTEND_URL: ${process.env.FRONTEND_URL || 'non défini'}`);
      console.log(`🌍 BACKEND_URL: ${process.env.BACKEND_URL || 'non défini'}`);
      
      // En production, autoriser aussi les requêtes depuis le backend lui-même (pour Swagger)
      // et les requêtes sans origin (Postman, curl, etc.)
      if (process.env.NODE_ENV === 'production') {
        // Autoriser les requêtes depuis le même domaine (Swagger)
        const originHost = origin ? new URL(origin).hostname : null;
        const backendHost = process.env.BACKEND_URL ? new URL(process.env.BACKEND_URL).hostname : null;
        
        if (originHost && backendHost && originHost === backendHost) {
          return callback(null, true);
        }
      }
      
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
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
