import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    this.$extends(withAccelerate());
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
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
