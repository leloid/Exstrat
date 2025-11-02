import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'colorless',
      // Configuration du pool de connexions pour éviter les "Connection reset by peer"
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Logger les erreurs Prisma
    this.$on('error' as never, (e: any) => {
      this.logger.error('Prisma error:', e);
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn('Prisma warning:', e);
    });
    
    // Extension Accelerate (optionnel, peut être désactivé si problèmes)
    try {
      this.$extends(withAccelerate());
    } catch (error) {
      this.logger.warn('Prisma Accelerate extension failed, continuing without it:', error);
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to database successfully');
      
      // Test de connexion avec retry
      await this.checkConnection();
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('✅ Disconnected from database');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from database:', error);
    }
  }

  async checkConnection(): Promise<{ status: string; message: string; timestamp: Date }> {
    try {
      // Test simple de connexion avec une requête basique
      await this.$queryRaw`SELECT 1`;
      
      return {
        status: 'success',
        message: 'Connexion à la base de données réussie',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Erreur de connexion: ${error.message}`,
        timestamp: new Date()
      };
    }
  }

  async getDatabaseInfo(): Promise<{ 
    provider: string; 
    url: string; 
    connected: boolean;
    tables: string[];
  }> {
    try {
      // Récupérer les informations de la base de données
      const tables = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      
      return {
        provider: 'PostgreSQL via Prisma Accelerate',
        url: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@') || 'Non configuré',
        connected: true,
        tables: tables.map(t => t.tablename)
      };
    } catch (error) {
      return {
        provider: 'PostgreSQL via Prisma Accelerate',
        url: process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@') || 'Non configuré',
        connected: false,
        tables: []
      };
    }
  }
}
