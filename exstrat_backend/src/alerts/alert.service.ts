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
  }

  /**
   * Vérifie les alertes pour un token donné
   * Utilise uniquement StepAlert et StrategyAlert (nouveau système)
   * @param cmcId CoinMarketCap ID du token
   * @param currentPrice Prix actuel du token
   */
  async checkAlertsForToken(cmcId: number, currentPrice: number): Promise<void> {
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

      // Récupérer toutes les StepAlerts actives pour ce token
      const stepAlerts = await this.prisma.stepAlert.findMany({
        where: {
          step: {
            strategy: {
              asset: token.symbol,
              status: 'active',
              strategyAlert: {
                isActive: true,
                notificationChannels: {
                  path: ['email'],
                  equals: true,
                },
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
                  steps: {
                    orderBy: {
                      targetPrice: 'asc',
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (stepAlerts.length === 0) {
        this.logger.log(
          `Alerts: no eligible step-alerts for ${token.symbol} (strategy must be status=active and alerts enabled)`,
        );
        return;
      }

      for (const stepAlert of stepAlerts) {
        const targetPrice = Number(stepAlert.step.targetPrice);
        const step = stepAlert.step;
        const strategy = step.strategy;

        // Vérifier si l'email est activé dans les canaux de notification
        const notificationChannels = strategy.strategyAlert?.notificationChannels as { email?: boolean } | null;
        if (!notificationChannels?.email) {
          continue;
        }

        // Calculer l'ordre du step (index dans la liste triée + 1)
        const stepOrder = strategy.steps.findIndex((s) => s.id === step.id) + 1;

        // 1. Vérifier l'alerte "beforeTP" (avant d'atteindre le TP)
        const beforeTPEmailSentAt = (stepAlert as any).beforeTPEmailSentAt;
        if (stepAlert.beforeTPEnabled && stepAlert.beforeTPPercentage && !beforeTPEmailSentAt) {
          const beforeTPPrice = targetPrice * (1 - stepAlert.beforeTPPercentage / 100);
          
          if (currentPrice >= beforeTPPrice && currentPrice < targetPrice) {
            // Le prix est dans la zone "before TP" et l'email n'a pas encore été envoyé
            const lockKey = `alert:lock:beforeTP:${strategy.userId}:${stepAlert.id}`;
            const acquired = await this.acquireLock(lockKey);

            if (acquired) {
              this.logger.log(
                `Alert beforeTP: ${strategy.asset} price=$${currentPrice} TP=$${targetPrice} stepAlert=${stepAlert.id} → queue`,
              );

              await this.emailQueue.add('send-step-alert', {
                userId: strategy.userId,
                stepAlertId: stepAlert.id,
                stepId: stepAlert.stepId,
                strategyId: strategy.id,
                tokenSymbol: strategy.asset,
                currentPrice,
                targetPrice,
                alertType: 'beforeTP',
                stepOrder,
              });
            }
          }
        }

        // 2. Vérifier l'alerte "tpReached" (TP atteint)
        const tpReachedEmailSentAt = (stepAlert as any).tpReachedEmailSentAt;
        if (stepAlert.tpReachedEnabled && !tpReachedEmailSentAt) {
          if (this.isTargetReached(currentPrice, targetPrice, step.targetType)) {
            const lockKey = `alert:lock:tpReached:${strategy.userId}:${stepAlert.id}`;
            const acquired = await this.acquireLock(lockKey);

            if (acquired) {
              this.logger.log(
                `Alert tpReached: ${strategy.asset} price=$${currentPrice} TP=$${targetPrice} stepAlert=${stepAlert.id} → queue`,
              );

              await this.emailQueue.add('send-step-alert', {
                userId: strategy.userId,
                stepAlertId: stepAlert.id,
                stepId: stepAlert.stepId,
                strategyId: strategy.id,
                tokenSymbol: strategy.asset,
                currentPrice,
                targetPrice,
                alertType: 'tpReached',
                stepOrder,
              });
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking alerts for token ${cmcId}:`, error);
      throw error;
    }
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

