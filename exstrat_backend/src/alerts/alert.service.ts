import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly LOCK_TTL: number; // TTL du lock en secondes (empêche re-trigger)

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @InjectQueue('send-email') private readonly emailQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // TTL configurable via env (défaut: 5 minutes = 300 secondes)
    this.LOCK_TTL = parseInt(
      this.configService.get<string>('ALERT_LOCK_TTL_SECONDS') || '300',
      10,
    );
    this.logger.log(`Alert lock TTL configured to ${this.LOCK_TTL} seconds (${this.LOCK_TTL / 60} minutes)`);
  }

  /**
   * Vérifie les alertes pour un token donné
   * @param cmcId CoinMarketCap ID du token
   * @param currentPrice Prix actuel du token
   */
  async checkAlertsForToken(cmcId: number, currentPrice: number): Promise<void> {
    try {
      // 1. Récupérer toutes les stratégies avec ce token qui ont des steps pending
      const strategies = await this.getStrategiesWithToken(cmcId);

      for (const strategy of strategies) {
        // Récupérer les steps pending de cette stratégie
        const pendingSteps = await this.prisma.strategyStep.findMany({
          where: {
            strategyId: strategy.id,
            state: 'pending',
          },
        });

        for (const step of pendingSteps) {
          const targetPrice = Number(step.targetPrice);

          // Vérifier si le target price est atteint
          if (this.isTargetReached(currentPrice, targetPrice, step.targetType)) {
            // Vérifier le lock pour éviter les doublons
            const lockKey = `alert:lock:${strategy.userId}:${strategy.id}:${step.id}`;
            const acquired = await this.acquireLock(lockKey);

            if (acquired) {
              this.logger.log(
                `Target price reached for strategy ${strategy.id}, step ${step.id}: $${currentPrice} >= $${targetPrice}`,
              );

              // Ajouter à la queue d'email
              await this.emailQueue.add('send-alert', {
                userId: strategy.userId,
                strategyId: strategy.id,
                stepId: step.id,
                tokenSymbol: strategy.asset,
                currentPrice,
                targetPrice,
                stepOrder: step.targetPct.toString(),
              });
            } else {
              this.logger.debug(`Lock already exists for ${lockKey}, skipping`);
            }
          }
        }
      }

      // 2. Vérifier les TPAlerts
      await this.checkTPAlerts(cmcId, currentPrice);
    } catch (error) {
      this.logger.error(`Error checking alerts for token ${cmcId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifie les TPAlerts pour un token
   */
  private async checkTPAlerts(cmcId: number, currentPrice: number): Promise<void> {
    try {
      // Récupérer le token depuis la table Token
      const token = await this.prisma.token.findFirst({
        where: {
          cmcId,
        },
        select: {
          symbol: true,
        },
      });

      if (!token) {
        return;
      }

      // Récupérer les StepAlerts actives pour ce token via les StrategySteps
      // TODO: Mettre à jour cette logique pour utiliser StrategyAlert et StepAlert
      // Pour l'instant, on récupère les steps des stratégies actives qui ont des alertes activées
      const stepAlerts = await this.prisma.stepAlert.findMany({
        where: {
          tpReachedEnabled: true,
          step: {
            strategy: {
              asset: token.symbol,
              status: 'active',
              strategyAlert: {
          isActive: true,
              },
            },
          },
        },
        include: {
          step: {
            include: {
              strategy: {
                include: {
                  strategyAlert: true,
                },
              },
            },
          },
        },
      });

      for (const stepAlert of stepAlerts) {
        const targetPrice = Number(stepAlert.step.targetPrice);

        // Vérifier si le TP est atteint
        if (currentPrice >= targetPrice) {
          const lockKey = `alert:lock:step:${stepAlert.step.strategy.userId}:${stepAlert.id}`;
          const acquired = await this.acquireLock(lockKey);

          if (acquired) {
            this.logger.log(
              `Step Alert triggered: ${stepAlert.id} - $${currentPrice} >= $${targetPrice}`,
            );

            await this.emailQueue.add('send-tp-alert', {
              userId: stepAlert.step.strategy.userId,
              stepAlertId: stepAlert.id,
              stepId: stepAlert.stepId,
              tokenSymbol: stepAlert.step.strategy.asset,
              currentPrice,
              targetPrice,
              strategyId: stepAlert.step.strategyId,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking TP alerts:`, error);
    }
  }

  /**
   * Récupère toutes les stratégies actives qui utilisent ce token
   */
  private async getStrategiesWithToken(cmcId: number): Promise<any[]> {
    // Récupérer le symbol depuis la table Token
    const token = await this.prisma.token.findFirst({
      where: {
        cmcId,
      },
      select: {
        symbol: true,
      },
    });

    if (!token) {
      return [];
    }

    // Récupérer les stratégies actives avec ce symbol
    const strategies = await this.prisma.strategy.findMany({
      where: {
        asset: token.symbol,
        status: 'active',
      },
      include: {
        steps: {
          where: {
            state: 'pending',
          },
        },
      },
    });

    // Filtrer pour ne garder que celles qui ont des steps pending
    return strategies.filter((s) => s.steps.length > 0);
  }

  /**
   * Vérifie si le target price est atteint
   */
  private isTargetReached(
    currentPrice: number,
    targetPrice: number,
    targetType: string,
  ): boolean {
    // Pour les prix exacts, vérifier si le prix actuel >= target price
    if (targetType === 'exact_price') {
      return currentPrice >= targetPrice;
    }

    // Pour les pourcentages, on suppose que targetPrice est déjà calculé
    return currentPrice >= targetPrice;
  }

  /**
   * Acquiert un lock Redis pour éviter les doublons
   */
  private async acquireLock(lockKey: string): Promise<boolean> {
    try {
      // SET NX EX : Set if Not eXists, avec expiration
      const result = await this.redis.set(lockKey, '1', 'EX', this.LOCK_TTL, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Error acquiring lock ${lockKey}:`, error);
      return false;
    }
  }
}

