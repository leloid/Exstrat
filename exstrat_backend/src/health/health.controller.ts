import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Vérifier la santé de l\'application',
    description: 'Endpoint simple pour vérifier que l\'API fonctionne'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application en bonne santé',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Exstrat Backend API'
    };
  }

  @Get('database')
  @ApiOperation({ 
    summary: 'Vérifier la connexion à la base de données',
    description: 'Teste la connexion à PostgreSQL via Prisma Accelerate'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connexion à la base de données réussie',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string', example: 'Connexion à la base de données réussie' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Erreur de connexion à la base de données',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        message: { type: 'string', example: 'Erreur de connexion: ...' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
      }
    }
  })
  async checkDatabase() {
    return await this.prismaService.checkConnection();
  }

  @Get('database/info')
  @ApiOperation({ 
    summary: 'Informations sur la base de données',
    description: 'Récupère les informations détaillées sur la base de données'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Informations sur la base de données',
    schema: {
      type: 'object',
      properties: {
        provider: { type: 'string', example: 'PostgreSQL via Prisma Accelerate' },
        url: { type: 'string', example: 'prisma+postgres://***@accelerate.prisma-data.net' },
        connected: { type: 'boolean', example: true },
        tables: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['User', 'ExchangeAccount', 'Balance', 'Trade', 'Transfer', 'Position', 'Strategy', 'StrategyStep', 'StrategyExecution']
        }
      }
    }
  })
  async getDatabaseInfo() {
    return await this.prismaService.getDatabaseInfo();
  }
}
