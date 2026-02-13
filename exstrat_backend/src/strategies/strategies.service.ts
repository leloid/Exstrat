import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateStrategyDto, 
  UpdateStrategyDto, 
  UpdateStrategyStepDto,
  StrategyResponseDto,
  StrategyStepResponseDto,
  StrategySearchDto,
  StrategySummaryDto,
  TargetType,
  StrategyStatus,
  StepState
} from './dto/strategy.dto';
import {
  CreateStrategyAlertDto,
  UpdateStrategyAlertDto,
  CreateStepAlertDto,
  UpdateStepAlertDto,
  StrategyAlertResponseDto,
  StepAlertResponseDto,
} from '../configuration/dto/strategy-alert.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(private prisma: PrismaService) {}

  async createStrategy(userId: string, createStrategyDto: CreateStrategyDto): Promise<StrategyResponseDto> {
    // Vérifier que l'utilisateur a des transactions pour ce token (optional check for virtual wallets)
    // For virtual wallets, we skip this check
    if (createStrategyDto.baseQuantity > 0) {
    const userTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        symbol: createStrategyDto.symbol,
        type: { in: ['BUY', 'TRANSFER_IN', 'STAKING', 'REWARD'] }
      }
    });

      if (userTransactions.length > 0) {
    // Calculer la quantité totale détenue
    const totalQuantity = userTransactions.reduce((sum, tx) => {
      if (tx.type === 'BUY' || tx.type === 'TRANSFER_IN' || tx.type === 'STAKING' || tx.type === 'REWARD') {
        return sum + Number(tx.quantity);
      } else {
        return sum - Number(tx.quantity);
      }
    }, 0);

        if (totalQuantity > 0 && createStrategyDto.baseQuantity > totalQuantity) {
          throw new BadRequestException(`La quantité de référence (${createStrategyDto.baseQuantity}) ne peut pas dépasser la quantité détenue (${totalQuantity})`);
        }
    }
    }

    // Vérifier que la somme des pourcentages de vente ne dépasse pas 100%
    const totalSellPercentage = createStrategyDto.steps.reduce((sum, step) => sum + step.sellPercentage, 0);
    if (totalSellPercentage > 100) {
      throw new BadRequestException('La somme des pourcentages de vente ne peut pas dépasser 100%');
    }

    // Créer la stratégie avec ses étapes
    const strategy = await this.prisma.strategy.create({
      data: {
        userId,
        name: createStrategyDto.name,
        asset: createStrategyDto.symbol,
        baseQty: new Decimal(createStrategyDto.baseQuantity),
        refPrice: new Decimal(createStrategyDto.referencePrice),
        status: createStrategyDto.status || StrategyStatus.PAUSED, // Default to PAUSED if not provided
        steps: {
          create: createStrategyDto.steps.map(step => {
            let targetPrice: Decimal;
            
            if (step.targetType === TargetType.EXACT_PRICE) {
              targetPrice = new Decimal(step.targetValue);
            } else {
              // Pourcentage du prix de référence
              targetPrice = new Decimal(createStrategyDto.referencePrice * (1 + step.targetValue / 100));
            }

            return {
              targetType: step.targetType,
              targetPct: new Decimal(step.targetValue),
              sellPct: new Decimal(step.sellPercentage),
              targetPrice,
              state: StepState.PENDING,
              notes: step.notes
            };
          })
        }
      },
      include: {
        steps: true
      }
    });

    this.logger.log(`Add strategy: ${createStrategyDto.name} (${createStrategyDto.symbol}) user=${userId}`);

    return await this.mapToResponseDto(strategy);
  }

  async findAll(userId: string, searchDto: StrategySearchDto): Promise<{ strategies: StrategyResponseDto[], total: number, page: number, limit: number }> {
    const { symbol, status, page = 1, limit = 20 } = searchDto;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(symbol && { asset: symbol }),
      ...(status && { status })
    };

    try {
      const [strategies, total] = await Promise.all([
        this.prisma.strategy.findMany({
          where,
          include: {
            steps: {
              orderBy: { targetPrice: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.strategy.count({ where })
      ]);

      const result = {
        strategies: await Promise.all(strategies.map(strategy => this.mapToResponseDto(strategy))),
        total,
        page,
        limit
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  async findOne(userId: string, id: string): Promise<StrategyResponseDto> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { targetPrice: 'asc' }
        }
      }
    });

    if (!strategy) {
      throw new NotFoundException(`Stratégie avec l'ID ${id} non trouvée`);
    }

    if (strategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas la permission d\'accéder à cette stratégie');
    }

    return await this.mapToResponseDto(strategy);
  }

  async update(userId: string, id: string, updateStrategyDto: UpdateStrategyDto): Promise<StrategyResponseDto> {
    const existingStrategy = await this.prisma.strategy.findUnique({
      where: { id }
    });

    if (!existingStrategy) {
      throw new NotFoundException(`Stratégie avec l'ID ${id} non trouvée`);
    }

    if (existingStrategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas la permission de modifier cette stratégie');
    }

    if (updateStrategyDto.steps) {
      await this.prisma.strategyStep.deleteMany({
        where: { strategyId: id }
      });
    }
    
    const updatedStrategy = await this.prisma.strategy.update({
      where: { id },
      data: {
        ...(updateStrategyDto.name && { name: updateStrategyDto.name }),
        ...(updateStrategyDto.symbol && { asset: updateStrategyDto.symbol }),
        ...(updateStrategyDto.baseQuantity && { baseQty: new Decimal(updateStrategyDto.baseQuantity) }),
        ...(updateStrategyDto.referencePrice && { refPrice: new Decimal(updateStrategyDto.referencePrice) }),
        ...(updateStrategyDto.status && { status: updateStrategyDto.status }),
        ...(updateStrategyDto.notes && { notes: updateStrategyDto.notes }),
        ...(updateStrategyDto.steps && {
          steps: {
            create: updateStrategyDto.steps.map(step => {
              let targetPrice: Decimal;
              
              if (step.targetType === TargetType.EXACT_PRICE) {
                targetPrice = new Decimal(step.targetValue);
              } else {
                // Pourcentage du prix de référence
                const refPrice = updateStrategyDto.referencePrice || Number(existingStrategy.refPrice);
                targetPrice = new Decimal(refPrice * (1 + step.targetValue / 100));
              }

              return {
                targetType: step.targetType,
                targetPct: new Decimal(step.targetValue),
                sellPct: new Decimal(step.sellPercentage),
                targetPrice,
                state: StepState.PENDING,
                notes: step.notes
              };
            })
          }
        })
      },
      include: {
        steps: {
          orderBy: { targetPrice: 'asc' }
        }
      }
    });

    return await this.mapToResponseDto(updatedStrategy);
  }

  async updateStep(userId: string, strategyId: string, stepId: string, updateStepDto: UpdateStrategyStepDto): Promise<StrategyStepResponseDto> {
    // Vérifier que la stratégie appartient à l'utilisateur
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId }
    });

    if (!strategy) {
      throw new NotFoundException(`Stratégie avec l'ID ${strategyId} non trouvée`);
    }

    if (strategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas la permission de modifier cette stratégie');
    }

    const existingStep = await this.prisma.strategyStep.findUnique({
      where: { id: stepId }
    });

    if (!existingStep) {
      throw new NotFoundException(`Étape avec l'ID ${stepId} non trouvée`);
    }

    if (existingStep.strategyId !== strategyId) {
      throw new BadRequestException('Cette étape n\'appartient pas à la stratégie spécifiée');
    }

    // Calculer le nouveau prix cible si nécessaire
    let targetPrice = existingStep.targetPrice;
    if (updateStepDto.targetType && updateStepDto.targetValue !== undefined) {
      if (updateStepDto.targetType === TargetType.EXACT_PRICE) {
        targetPrice = new Decimal(updateStepDto.targetValue);
      } else {
        targetPrice = new Decimal(Number(strategy.refPrice) * (1 + updateStepDto.targetValue / 100));
      }
    }

    const updatedStep = await this.prisma.strategyStep.update({
      where: { id: stepId },
      data: {
        ...(updateStepDto.targetType && { targetPct: new Decimal(updateStepDto.targetValue || 0) }),
        ...(updateStepDto.sellPercentage !== undefined && { sellPct: new Decimal(updateStepDto.sellPercentage) }),
        ...(updateStepDto.state && { state: updateStepDto.state }),
        ...(updateStepDto.notes && { notes: updateStepDto.notes }),
        targetPrice
      }
    });

    return this.mapToStepResponseDto(updatedStep);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existingStrategy = await this.prisma.strategy.findUnique({
      where: { id }
    });

    if (!existingStrategy) {
      throw new NotFoundException(`Stratégie avec l'ID ${id} non trouvée`);
    }

    if (existingStrategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas la permission de supprimer cette stratégie');
    }

    await this.prisma.strategyStep.deleteMany({
      where: { strategyId: id }
    });

    await this.prisma.strategy.delete({
      where: { id }
    });
  }

  async getStrategySummary(userId: string, id: string): Promise<StrategySummaryDto> {
    const strategy = await this.findOne(userId, id);

    const totalSteps = strategy.steps.length;
    const activeSteps = strategy.steps.filter(step => step.state === StepState.PENDING).length;
    const completedSteps = strategy.steps.filter(step => step.state === StepState.DONE).length;
    
    const totalTokensToSell = strategy.steps.reduce((sum, step) => {
      return sum + (Number(strategy.baseQuantity) * step.sellPercentage / 100);
    }, 0);

    const remainingTokens = Number(strategy.baseQuantity) - totalTokensToSell;

    // Calculer le profit estimé (simplifié)
    const estimatedTotalProfit = strategy.steps.reduce((sum, step) => {
      const tokensToSell = Number(strategy.baseQuantity) * step.sellPercentage / 100;
      const profit = tokensToSell * (Number(step.targetPrice) - Number(strategy.referencePrice));
      return sum + profit;
    }, 0);

    return {
      totalSteps,
      activeSteps,
      completedSteps,
      totalTokensToSell,
      remainingTokens,
      estimatedTotalProfit
    };
  }

  async getStrategiesByToken(userId: string, symbol: string): Promise<StrategyResponseDto[]> {
    const strategies = await this.prisma.strategy.findMany({
      where: {
        userId,
        asset: symbol,
        status: StrategyStatus.ACTIVE
      },
      include: {
        steps: {
          orderBy: { targetPrice: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(strategies.map(strategy => this.mapToResponseDto(strategy)));
  }

  private async mapToResponseDto(strategy: any): Promise<StrategyResponseDto> {
    // Try to get token info from transactions
    let tokenName = strategy.asset;
    let cmcId = 0;

    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          userId: strategy.userId,
          symbol: strategy.asset,
        },
        select: {
          name: true,
          cmcId: true,
        },
      });

      if (transaction) {
        tokenName = transaction.name || strategy.asset;
        cmcId = transaction.cmcId || 0;
      }
    } catch (error) {
      console.error('Error fetching token info for strategy:', error);
      // Fallback to default values
    }

    return {
      id: strategy.id,
      userId: strategy.userId,
      name: strategy.name,
      symbol: strategy.asset,
      tokenName,
      cmcId,
      baseQuantity: Number(strategy.baseQty),
      referencePrice: Number(strategy.refPrice),
      status: strategy.status,
      notes: strategy.notes,
      steps: strategy.steps.map(step => this.mapToStepResponseDto(step)),
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt
    };
  }

  private mapToStepResponseDto(step: any): StrategyStepResponseDto {
    return {
      id: step.id,
      strategyId: step.strategyId,
      targetType: step.targetType as TargetType || TargetType.PERCENTAGE_OF_AVERAGE,
      targetValue: Number(step.targetPct),
      targetPrice: Number(step.targetPrice),
      sellPercentage: Number(step.sellPct),
      sellQuantity: 0, // À calculer
      state: step.state,
      triggeredAt: step.triggeredAt,
      notes: step.notes,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt
    };
  }

  // ===== GESTION DES ALERTES DE STRATÉGIE =====

  /**
   * Créer ou mettre à jour une configuration d'alertes pour une stratégie
   */
  async createOrUpdateStrategyAlert(
    userId: string,
    strategyId: string,
    createDto: CreateStrategyAlertDto,
  ): Promise<StrategyAlertResponseDto> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) throw new NotFoundException('Stratégie non trouvée');
    if (strategy.userId !== userId) throw new ForbiddenException('Vous n\'avez pas accès à cette stratégie');

    const existing = await this.prisma.strategyAlert.findUnique({
      where: { strategyId },
    });

    if (existing) {
      const updateData: any = {};
      if (createDto.isActive !== undefined) updateData.isActive = createDto.isActive;
      if (createDto.notificationChannels) {
        updateData.notificationChannels = {
          email: createDto.notificationChannels.email,
          push: createDto.notificationChannels.push,
        };
      }
      const updated = await this.prisma.strategyAlert.update({
        where: { id: existing.id },
        data: updateData,
      });
      if (updated.isActive) {
        await this.prisma.strategy.update({ where: { id: strategyId }, data: { status: StrategyStatus.ACTIVE } });
        await this.ensureStepAlertsForStrategy(strategyId);
      }
      this.logger.log(`Alert updated: strategy=${strategyId} isActive=${updated.isActive}`);
      return this.mapToStrategyAlertResponseDto(updated);
    } else {
      const created = await this.prisma.strategyAlert.create({
        data: {
          strategyId,
          userId,
          isActive: createDto.isActive ?? true,
          notificationChannels: {
            email: createDto.notificationChannels?.email ?? true,
            push: createDto.notificationChannels?.push ?? true,
          },
        },
      });
      if (created.isActive) {
        await this.prisma.strategy.update({ where: { id: strategyId }, data: { status: StrategyStatus.ACTIVE } });
        await this.ensureStepAlertsForStrategy(strategyId);
      }
      this.logger.log(`Alert created: strategy=${strategyId} isActive=${created.isActive}`);
      return this.mapToStrategyAlertResponseDto(created);
    }
  }

  /**
   * Crée des StepAlerts par défaut pour chaque step de la stratégie s'ils n'existent pas.
   * Permet que les alertes (beforeTP / tpReached) soient évaluées dès que l'utilisateur active les alertes.
   */
  private async ensureStepAlertsForStrategy(strategyId: string): Promise<void> {
    const steps = await this.prisma.strategyStep.findMany({
      where: { strategyId },
      select: { id: true },
    });
    for (const step of steps) {
      const existing = await this.prisma.stepAlert.findUnique({
        where: { stepId: step.id },
      });
      if (!existing) {
        await this.prisma.stepAlert.create({
          data: {
            stepId: step.id,
            strategyId,
            beforeTPEnabled: true,
            beforeTPPercentage: 2,
            tpReachedEnabled: true,
          },
        });
        this.logger.log(`StepAlert created by default: step=${step.id} strategy=${strategyId}`);
      }
    }
  }

  /**
   * Récupérer la configuration d'alertes d'une stratégie
   */
  async getStrategyAlert(userId: string, strategyId: string): Promise<StrategyAlertResponseDto | null> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) throw new NotFoundException('Stratégie non trouvée');
    if (strategy.userId !== userId) throw new ForbiddenException('Vous n\'avez pas accès à cette stratégie');

    const alert = await this.prisma.strategyAlert.findUnique({
      where: { strategyId },
    });

    if (!alert) return null;
    return this.mapToStrategyAlertResponseDto(alert);
  }

  /**
   * Mettre à jour une configuration d'alertes
   */
  async updateStrategyAlert(
    userId: string,
    strategyId: string,
    updateDto: UpdateStrategyAlertDto,
  ): Promise<StrategyAlertResponseDto> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) throw new NotFoundException('Stratégie non trouvée');
    if (strategy.userId !== userId) throw new ForbiddenException('Vous n\'avez pas accès à cette stratégie');

    const existing = await this.prisma.strategyAlert.findUnique({
      where: { strategyId },
    });

    if (!existing) throw new NotFoundException('Configuration d\'alertes non trouvée');

    const updateData: any = {};
    if (updateDto.isActive !== undefined) updateData.isActive = updateDto.isActive;
    if (updateDto.notificationChannels) {
      updateData.notificationChannels = {
        email: updateDto.notificationChannels.email,
        push: updateDto.notificationChannels.push,
      } as any;
    }

    const updated = await this.prisma.strategyAlert.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (updated.isActive) {
      await this.prisma.strategy.update({ where: { id: strategyId }, data: { status: StrategyStatus.ACTIVE } });
      await this.ensureStepAlertsForStrategy(strategyId);
    }

    return this.mapToStrategyAlertResponseDto(updated);
  }

  /**
   * Supprimer une configuration d'alertes
   */
  async deleteStrategyAlert(userId: string, strategyId: string): Promise<void> {
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    if (strategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette stratégie');
    }

    const existing = await this.prisma.strategyAlert.findUnique({
      where: { strategyId },
    });

    if (existing) {
      await this.prisma.strategyAlert.delete({
        where: { id: existing.id },
      });
    }
  }

  /**
   * Créer ou mettre à jour une alerte pour un step
   */
  async createOrUpdateStepAlert(
    userId: string,
    stepId: string,
    createDto: CreateStepAlertDto,
  ): Promise<StepAlertResponseDto> {
    const finalStepId = createDto.stepId || stepId;
    const step = await this.prisma.strategyStep.findUnique({
      where: { id: finalStepId },
      include: { strategy: true },
    });

    if (!step) throw new NotFoundException('Step non trouvé');
    if (step.strategy.userId !== userId) throw new ForbiddenException('Vous n\'avez pas accès à ce step');

    const existing = await this.prisma.stepAlert.findUnique({
      where: { stepId: finalStepId },
    });

    if (existing) {
      const updated = await this.prisma.stepAlert.update({
        where: { id: existing.id },
        data: {
          beforeTPEnabled: createDto.beforeTPEnabled !== undefined ? createDto.beforeTPEnabled : existing.beforeTPEnabled,
          beforeTPPercentage: createDto.beforeTPPercentage !== undefined ? createDto.beforeTPPercentage : existing.beforeTPPercentage,
          tpReachedEnabled: createDto.tpReachedEnabled !== undefined ? createDto.tpReachedEnabled : existing.tpReachedEnabled,
        },
      });
      this.logger.log(`Step alert updated: step=${finalStepId} strategy=${step.strategyId}`);
      return this.mapToStepAlertResponseDto(updated);
    } else {
      const created = await this.prisma.stepAlert.create({
        data: {
          stepId: finalStepId,
          strategyId: step.strategyId,
          beforeTPEnabled: createDto.beforeTPEnabled ?? true,
          beforeTPPercentage: createDto.beforeTPPercentage ?? 2,
          tpReachedEnabled: createDto.tpReachedEnabled ?? true,
        },
      });
      this.logger.log(`Step alert created: step=${finalStepId} strategy=${step.strategyId}`);
      return this.mapToStepAlertResponseDto(created);
    }
  }

  /**
   * Récupérer une alerte de step
   */
  async getStepAlert(userId: string, stepId: string): Promise<StepAlertResponseDto | null> {
    const step = await this.prisma.strategyStep.findUnique({
      where: { id: stepId },
      include: { strategy: true },
    });

    if (!step) {
      throw new NotFoundException('Step non trouvé');
    }

    if (step.strategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce step');
    }

    const alert = await this.prisma.stepAlert.findUnique({
      where: { stepId },
    });

    if (!alert) {
      return null;
    }

    return this.mapToStepAlertResponseDto(alert);
  }

  /**
   * Mettre à jour une alerte de step
   */
  async updateStepAlert(
    userId: string,
    stepId: string,
    updateDto: UpdateStepAlertDto,
  ): Promise<StepAlertResponseDto> {
    const step = await this.prisma.strategyStep.findUnique({
      where: { id: stepId },
      include: { strategy: true },
    });

    if (!step) throw new NotFoundException('Step non trouvé');
    if (step.strategy.userId !== userId) throw new ForbiddenException('Vous n\'avez pas accès à ce step');

    const existing = await this.prisma.stepAlert.findUnique({
      where: { stepId },
    });

    if (!existing) throw new NotFoundException('Alerte de step non trouvée');

    const updated = await this.prisma.stepAlert.update({
      where: { id: existing.id },
      data: {
        ...(updateDto.beforeTPEnabled !== undefined && { beforeTPEnabled: updateDto.beforeTPEnabled }),
        ...(updateDto.beforeTPPercentage !== undefined && { beforeTPPercentage: updateDto.beforeTPPercentage }),
        ...(updateDto.tpReachedEnabled !== undefined && { tpReachedEnabled: updateDto.tpReachedEnabled }),
      },
    });

    return this.mapToStepAlertResponseDto(updated);
  }

  /**
   * Supprimer une alerte de step
   */
  async deleteStepAlert(userId: string, stepId: string): Promise<void> {
    const step = await this.prisma.strategyStep.findUnique({
      where: { id: stepId },
      include: { strategy: true },
    });

    if (!step) {
      throw new NotFoundException('Step non trouvé');
    }

    if (step.strategy.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce step');
    }

    const existing = await this.prisma.stepAlert.findUnique({
      where: { stepId },
    });

    if (existing) {
      await this.prisma.stepAlert.delete({
        where: { id: existing.id },
      });
    }
  }

  /**
   * Mapper StrategyAlert vers DTO de réponse
   */
  private mapToStrategyAlertResponseDto(alert: any): StrategyAlertResponseDto {
    return {
      id: alert.id,
      strategyId: alert.strategyId,
      userId: alert.userId,
      isActive: alert.isActive,
      notificationChannels: alert.notificationChannels as { email: boolean; push: boolean },
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }

  /**
   * Mapper StepAlert vers DTO de réponse
   */
  private mapToStepAlertResponseDto(alert: any): StepAlertResponseDto {
    return {
      id: alert.id,
      stepId: alert.stepId,
      strategyId: alert.strategyId,
      beforeTPEnabled: alert.beforeTPEnabled,
      beforeTPPercentage: alert.beforeTPPercentage ?? 2,
      tpReachedEnabled: alert.tpReachedEnabled,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }
}
