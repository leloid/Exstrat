import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAlertConfigurationDto,
  UpdateAlertConfigurationDto,
  CreateTokenAlertDto,
  UpdateTokenAlertDto,
  CreateTPAlertDto,
  UpdateTPAlertDto,
  AlertConfigurationResponseDto,
  TokenAlertResponseDto,
  TPAlertResponseDto,
} from './dto/alert.dto';

@Injectable()
export class ConfigurationService {
  constructor(private prisma: PrismaService) {}

  // ===== CONFIGURATION D'ALERTES =====

  /**
   * Créer une configuration d'alertes pour une prévision
   */
  async createAlertConfiguration(
    userId: string,
    createDto: CreateAlertConfigurationDto,
  ): Promise<AlertConfigurationResponseDto> {
    // Vérifier que la prévision existe et appartient à l'utilisateur
    const forecast = await this.prisma.forecast.findFirst({
      where: {
        id: createDto.forecastId,
        userId,
      },
    });

    if (!forecast) {
      throw new NotFoundException('Prévision non trouvée');
    }

    // Vérifier qu'il n'existe pas déjà une configuration pour cette prévision
    const existing = await this.prisma.alertConfiguration.findUnique({
      where: { forecastId: createDto.forecastId },
    });

    if (existing) {
      throw new BadRequestException('Une configuration d\'alertes existe déjà pour cette prévision');
    }

    // Si on active cette configuration, désactiver toutes les autres configurations du même portfolio
    if (createDto.isActive !== false) {
      // Récupérer toutes les prévisions du même portfolio
      const forecastsInPortfolio = await this.prisma.forecast.findMany({
        where: {
          portfolioId: forecast.portfolioId,
          userId,
        },
        select: { id: true },
      });

      const forecastIds = forecastsInPortfolio.map(f => f.id);

      // Désactiver toutes les autres configurations actives du même portfolio
      await this.prisma.alertConfiguration.updateMany({
        where: {
          userId,
          forecastId: { in: forecastIds },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Créer la configuration avec les alertes token si fournies
    const configuration = await this.prisma.alertConfiguration.create({
      data: {
        userId,
        forecastId: createDto.forecastId,
        isActive: createDto.isActive ?? true,
        notificationChannels: {
          email: createDto.notificationChannels.email,
          push: createDto.notificationChannels.push,
        },
        tokenAlerts: createDto.tokenAlerts
          ? {
              create: createDto.tokenAlerts.map((tokenAlert) => ({
                holdingId: tokenAlert.holdingId,
                tokenSymbol: tokenAlert.tokenSymbol,
                strategyId: tokenAlert.strategyId,
                numberOfTargets: tokenAlert.numberOfTargets,
                // Si la configuration est active, activer toutes les alertes par défaut
                isActive: (createDto.isActive !== false) ? (tokenAlert.isActive ?? true) : (tokenAlert.isActive ?? false),
                tpAlerts: {
                  create: tokenAlert.tpAlerts.map((tpAlert) => ({
                    tpOrder: tpAlert.tpOrder,
                    targetPrice: tpAlert.targetPrice,
                    sellQuantity: tpAlert.sellQuantity,
                    projectedAmount: tpAlert.projectedAmount,
                    remainingValue: tpAlert.remainingValue,
                    beforeTPEnabled: tpAlert.beforeTP.enabled,
                    beforeTPValue: tpAlert.beforeTP.value ?? -10, // Défaut: -10%
                    beforeTPType: tpAlert.beforeTP.type ?? 'percentage',
                    tpReachedEnabled: tpAlert.tpReached.enabled,
                    // Si la configuration est active, activer toutes les alertes TP par défaut
                    isActive: (createDto.isActive !== false) ? (tpAlert.isActive ?? true) : (tpAlert.isActive ?? false),
                  })),
                },
              })),
            }
          : undefined,
      },
      include: {
        tokenAlerts: {
          include: {
            tpAlerts: {
              orderBy: { tpOrder: 'asc' },
            },
          },
        },
      },
    });

    return this.formatAlertConfigurationResponse(configuration);
  }

  /**
   * Récupérer une configuration d'alertes par ID de prévision
   */
  async getAlertConfigurationByForecast(
    userId: string,
    forecastId: string,
  ): Promise<AlertConfigurationResponseDto | null> {
    const configuration = await this.prisma.alertConfiguration.findFirst({
      where: {
        forecastId,
        userId,
      },
      include: {
        tokenAlerts: {
          include: {
            tpAlerts: {
              orderBy: { tpOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!configuration) {
      return null;
    }

    return this.formatAlertConfigurationResponse(configuration);
  }

  /**
   * Récupérer une configuration d'alertes par ID
   * OPTIMIZED: Direct query instead of loading all configs
   */
  async getAlertConfigurationById(
    userId: string,
    configurationId: string,
  ): Promise<AlertConfigurationResponseDto> {
    const configuration = await this.prisma.alertConfiguration.findFirst({
      where: {
        id: configurationId,
        userId,
      },
      include: {
        tokenAlerts: {
          include: {
            tpAlerts: {
              orderBy: { tpOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!configuration) {
      throw new NotFoundException('Configuration d\'alertes non trouvée');
    }

    return this.formatAlertConfigurationResponse(configuration);
  }

  /**
   * Récupérer toutes les configurations d'alertes d'un utilisateur
   * OPTIMIZED: Only load active configs by default, with optional filter
   */
  async getAllAlertConfigurations(userId: string, activeOnly: boolean = false): Promise<AlertConfigurationResponseDto[]> {
    const configurations = await this.prisma.alertConfiguration.findMany({
      where: {
        userId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        tokenAlerts: {
          include: {
            tpAlerts: {
              orderBy: { tpOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return configurations.map((config) => this.formatAlertConfigurationResponse(config));
  }

  /**
   * Mettre à jour une configuration d'alertes
   */
  async updateAlertConfiguration(
    userId: string,
    configurationId: string,
    updateDto: UpdateAlertConfigurationDto,
  ): Promise<AlertConfigurationResponseDto> {
    // Vérifier que la configuration existe et appartient à l'utilisateur
    const existing = await this.prisma.alertConfiguration.findFirst({
      where: {
        id: configurationId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Configuration d\'alertes non trouvée');
    }

    // Si on active cette configuration, désactiver toutes les autres configurations du même portfolio
    if (updateDto.isActive === true) {
      // Récupérer la prévision associée pour obtenir le portfolioId
      const forecast = await this.prisma.forecast.findUnique({
        where: { id: existing.forecastId },
        select: { portfolioId: true },
      });

      if (forecast) {
        // Récupérer toutes les prévisions du même portfolio
        const forecastsInPortfolio = await this.prisma.forecast.findMany({
          where: {
            portfolioId: forecast.portfolioId,
            userId,
          },
          select: { id: true },
        });

        const forecastIds = forecastsInPortfolio.map(f => f.id);

        // Désactiver toutes les autres configurations actives du même portfolio (sauf celle qu'on est en train de mettre à jour)
        await this.prisma.alertConfiguration.updateMany({
          where: {
            userId,
            forecastId: { in: forecastIds },
            id: { not: configurationId },
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }

      // Activer toutes les alertes (TokenAlert et TPAlert) de cette configuration
      // Activer toutes les alertes token de cette configuration
      await this.prisma.tokenAlert.updateMany({
        where: {
          alertConfigurationId: configurationId,
        },
        data: {
          isActive: true,
        },
      });

      // Activer toutes les alertes TP de cette configuration
      const tokenAlerts = await this.prisma.tokenAlert.findMany({
        where: {
          alertConfigurationId: configurationId,
        },
        select: { id: true },
      });

      const tokenAlertIds = tokenAlerts.map(ta => ta.id);
      if (tokenAlertIds.length > 0) {
        await this.prisma.tPAlert.updateMany({
          where: {
            tokenAlertId: { in: tokenAlertIds },
          },
          data: {
            isActive: true,
          },
        });
      }
    }

    const updated = await this.prisma.alertConfiguration.update({
      where: { id: configurationId },
      data: {
        isActive: updateDto.isActive,
        notificationChannels: updateDto.notificationChannels
          ? {
              email: updateDto.notificationChannels.email,
              push: updateDto.notificationChannels.push,
            }
          : undefined,
      },
      include: {
        tokenAlerts: {
          include: {
            tpAlerts: {
              orderBy: { tpOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.formatAlertConfigurationResponse(updated);
  }

  /**
   * Supprimer une configuration d'alertes
   */
  async deleteAlertConfiguration(userId: string, configurationId: string): Promise<void> {
    const existing = await this.prisma.alertConfiguration.findFirst({
      where: {
        id: configurationId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Configuration d\'alertes non trouvée');
    }

    await this.prisma.alertConfiguration.delete({
      where: { id: configurationId },
    });
  }

  // ===== ALERTES TOKEN =====

  /**
   * Ajouter une alerte token à une configuration
   */
  async addTokenAlert(
    userId: string,
    configurationId: string,
    createDto: CreateTokenAlertDto,
  ): Promise<TokenAlertResponseDto> {
    // Vérifier que la configuration existe et appartient à l'utilisateur
    const configuration = await this.prisma.alertConfiguration.findFirst({
      where: {
        id: configurationId,
        userId,
      },
    });

    if (!configuration) {
      throw new NotFoundException('Configuration d\'alertes non trouvée');
    }

    // Vérifier qu'il n'existe pas déjà une alerte pour ce token
    const existing = await this.prisma.tokenAlert.findUnique({
      where: {
        alertConfigurationId_holdingId: {
          alertConfigurationId: configurationId,
          holdingId: createDto.holdingId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Une alerte existe déjà pour ce token');
    }

    const tokenAlert = await this.prisma.tokenAlert.create({
      data: {
        alertConfigurationId: configurationId,
        holdingId: createDto.holdingId,
        tokenSymbol: createDto.tokenSymbol,
        strategyId: createDto.strategyId,
        numberOfTargets: createDto.numberOfTargets,
        isActive: createDto.isActive ?? true,
        tpAlerts: {
          create: createDto.tpAlerts.map((tpAlert) => ({
            tpOrder: tpAlert.tpOrder,
            targetPrice: tpAlert.targetPrice,
            sellQuantity: tpAlert.sellQuantity,
            projectedAmount: tpAlert.projectedAmount,
            remainingValue: tpAlert.remainingValue,
            beforeTPEnabled: tpAlert.beforeTP.enabled,
            beforeTPValue: tpAlert.beforeTP.value ?? -10,
            beforeTPType: tpAlert.beforeTP.type ?? 'percentage',
            tpReachedEnabled: tpAlert.tpReached.enabled,
            isActive: tpAlert.isActive ?? true,
          })),
        },
      },
      include: {
        tpAlerts: {
          orderBy: { tpOrder: 'asc' },
        },
      },
    });

    return this.formatTokenAlertResponse(tokenAlert);
  }

  /**
   * Mettre à jour une alerte token
   */
  async updateTokenAlert(
    userId: string,
    tokenAlertId: string,
    updateDto: UpdateTokenAlertDto,
  ): Promise<TokenAlertResponseDto> {
    // Vérifier que l'alerte token existe et appartient à l'utilisateur
    const tokenAlert = await this.prisma.tokenAlert.findFirst({
      where: {
        id: tokenAlertId,
        alertConfiguration: {
          userId,
        },
      },
    });

    if (!tokenAlert) {
      throw new NotFoundException('Alerte token non trouvée');
    }

    const updated = await this.prisma.tokenAlert.update({
      where: { id: tokenAlertId },
      data: {
        strategyId: updateDto.strategyId,
        numberOfTargets: updateDto.numberOfTargets,
        isActive: updateDto.isActive,
      },
      include: {
        tpAlerts: {
          orderBy: { tpOrder: 'asc' },
        },
      },
    });

    return this.formatTokenAlertResponse(updated);
  }

  /**
   * Supprimer une alerte token
   */
  async deleteTokenAlert(userId: string, tokenAlertId: string): Promise<void> {
    const tokenAlert = await this.prisma.tokenAlert.findFirst({
      where: {
        id: tokenAlertId,
        alertConfiguration: {
          userId,
        },
      },
    });

    if (!tokenAlert) {
      throw new NotFoundException('Alerte token non trouvée');
    }

    await this.prisma.tokenAlert.delete({
      where: { id: tokenAlertId },
    });
  }

  /**
   * Activer/désactiver toutes les alertes d'un token
   */
  async toggleTokenAlert(userId: string, tokenAlertId: string, isActive: boolean): Promise<TokenAlertResponseDto> {
    const tokenAlert = await this.prisma.tokenAlert.findFirst({
      where: {
        id: tokenAlertId,
        alertConfiguration: {
          userId,
        },
      },
    });

    if (!tokenAlert) {
      throw new NotFoundException('Alerte token non trouvée');
    }

    // Mettre à jour l'alerte token et toutes ses alertes TP
    const updated = await this.prisma.tokenAlert.update({
      where: { id: tokenAlertId },
      data: {
        isActive,
        tpAlerts: {
          updateMany: {
            where: {},
            data: { isActive },
          },
        },
      },
      include: {
        tpAlerts: {
          orderBy: { tpOrder: 'asc' },
        },
      },
    });

    return this.formatTokenAlertResponse(updated);
  }

  // ===== ALERTES TP =====

  /**
   * Ajouter une alerte TP à une alerte token
   */
  async addTPAlert(
    userId: string,
    tokenAlertId: string,
    createDto: CreateTPAlertDto,
  ): Promise<TPAlertResponseDto> {
    // Vérifier que l'alerte token existe et appartient à l'utilisateur
    const tokenAlert = await this.prisma.tokenAlert.findFirst({
      where: {
        id: tokenAlertId,
        alertConfiguration: {
          userId,
        },
      },
    });

    if (!tokenAlert) {
      throw new NotFoundException('Alerte token non trouvée');
    }

    // Vérifier qu'il n'existe pas déjà une alerte pour ce TP
    const existing = await this.prisma.tPAlert.findUnique({
      where: {
        tokenAlertId_tpOrder: {
          tokenAlertId,
          tpOrder: createDto.tpOrder,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Une alerte existe déjà pour le TP ${createDto.tpOrder}`);
    }

    const tpAlert = await this.prisma.tPAlert.create({
      data: {
        tokenAlertId,
        tpOrder: createDto.tpOrder,
        targetPrice: createDto.targetPrice,
        sellQuantity: createDto.sellQuantity,
        projectedAmount: createDto.projectedAmount,
        remainingValue: createDto.remainingValue,
        beforeTPEnabled: createDto.beforeTP.enabled,
        beforeTPValue: createDto.beforeTP.value ?? -10,
        beforeTPType: createDto.beforeTP.type ?? 'percentage',
        tpReachedEnabled: createDto.tpReached.enabled,
        isActive: createDto.isActive ?? true,
      },
    });

    return this.formatTPAlertResponse(tpAlert);
  }

  /**
   * Mettre à jour une alerte TP
   */
  async updateTPAlert(
    userId: string,
    tpAlertId: string,
    updateDto: UpdateTPAlertDto,
  ): Promise<TPAlertResponseDto> {
    // Vérifier que l'alerte TP existe et appartient à l'utilisateur
    const tpAlert = await this.prisma.tPAlert.findFirst({
      where: {
        id: tpAlertId,
        tokenAlert: {
          alertConfiguration: {
            userId,
          },
        },
      },
    });

    if (!tpAlert) {
      throw new NotFoundException('Alerte TP non trouvée');
    }

    const updateData: any = {
      isActive: updateDto.isActive,
    };

    if (updateDto.beforeTP) {
      updateData.beforeTPEnabled = updateDto.beforeTP.enabled;
      updateData.beforeTPValue = updateDto.beforeTP.value ?? tpAlert.beforeTPValue;
      updateData.beforeTPType = updateDto.beforeTP.type ?? tpAlert.beforeTPType;
    }

    if (updateDto.tpReached) {
      updateData.tpReachedEnabled = updateDto.tpReached.enabled;
    }

    const updated = await this.prisma.tPAlert.update({
      where: { id: tpAlertId },
      data: updateData,
    });

    return this.formatTPAlertResponse(updated);
  }

  /**
   * Supprimer une alerte TP
   */
  async deleteTPAlert(userId: string, tpAlertId: string): Promise<void> {
    const tpAlert = await this.prisma.tPAlert.findFirst({
      where: {
        id: tpAlertId,
        tokenAlert: {
          alertConfiguration: {
            userId,
          },
        },
      },
    });

    if (!tpAlert) {
      throw new NotFoundException('Alerte TP non trouvée');
    }

    await this.prisma.tPAlert.delete({
      where: { id: tpAlertId },
    });
  }

  // ===== MÉTHODES UTILITAIRES =====

  private formatAlertConfigurationResponse(config: any): AlertConfigurationResponseDto {
    return {
      id: config.id,
      userId: config.userId,
      forecastId: config.forecastId,
      isActive: config.isActive,
      notificationChannels: config.notificationChannels as any,
      tokenAlerts: config.tokenAlerts?.map((ta: any) => this.formatTokenAlertResponse(ta)) || [],
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private formatTokenAlertResponse(tokenAlert: any): TokenAlertResponseDto {
    return {
      id: tokenAlert.id,
      alertConfigurationId: tokenAlert.alertConfigurationId,
      holdingId: tokenAlert.holdingId,
      tokenSymbol: tokenAlert.tokenSymbol,
      strategyId: tokenAlert.strategyId || undefined,
      numberOfTargets: tokenAlert.numberOfTargets,
      isActive: tokenAlert.isActive,
      tpAlerts: tokenAlert.tpAlerts?.map((tpa: any) => this.formatTPAlertResponse(tpa)) || [],
      createdAt: tokenAlert.createdAt,
      updatedAt: tokenAlert.updatedAt,
    };
  }

  private formatTPAlertResponse(tpAlert: any): TPAlertResponseDto {
    return {
      id: tpAlert.id,
      tokenAlertId: tpAlert.tokenAlertId,
      tpOrder: tpAlert.tpOrder,
      targetPrice: Number(tpAlert.targetPrice),
      sellQuantity: Number(tpAlert.sellQuantity),
      projectedAmount: Number(tpAlert.projectedAmount),
      remainingValue: Number(tpAlert.remainingValue),
      beforeTPEnabled: tpAlert.beforeTPEnabled,
      beforeTPValue: tpAlert.beforeTPValue ? Number(tpAlert.beforeTPValue) : undefined,
      beforeTPType: tpAlert.beforeTPType,
      tpReachedEnabled: tpAlert.tpReachedEnabled,
      isActive: tpAlert.isActive,
      createdAt: tpAlert.createdAt,
      updatedAt: tpAlert.updatedAt,
    };
  }
}

