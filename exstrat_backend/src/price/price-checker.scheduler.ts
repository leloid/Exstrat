import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PriceCheckerScheduler {
  private readonly logger = new Logger(PriceCheckerScheduler.name);

  constructor(
    @InjectQueue('price-check') private readonly priceCheckQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Afficher l'intervalle configuré au démarrage
    const intervalSeconds = parseInt(
      this.configService.get<string>('PRICE_CHECK_INTERVAL_SECONDS') || '60',
      10,
    );
    this.logger.log(`✅ Price checker scheduler initialized - checking prices every ${intervalSeconds} seconds`);
  }

  /**
   * Cron job qui s'exécute toutes les 60 secondes par défaut
   * Récupère tous les tokens uniques avec alertes actives et les ajoute à la queue
   * 
   * Pour changer l'intervalle, utilisez PRICE_CHECK_INTERVAL_SECONDS dans .env
   * Note: Le cron doit être modifié manuellement dans le code si vous voulez un autre intervalle
   */
  @Cron('*/60 * * * * *') // Toutes les 60 secondes
  async checkPrices() {
    this.logger.log('Starting scheduled price check...');

    try {
      // 1. Récupérer tous les tokens uniques avec alertes actives
      const uniqueTokens = await this.getUniqueTokensWithActiveAlerts();

      if (uniqueTokens.length === 0) {
        this.logger.debug('No active alerts found, skipping price check');
        return;
      }

      this.logger.log(`Found ${uniqueTokens.length} unique tokens with active alerts`);

      // 2. Grouper par batch de 100 (limite CoinMarketCap)
      const BATCH_SIZE = 100;
      const batches: number[][] = [];

      for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
        batches.push(uniqueTokens.slice(i, i + BATCH_SIZE));
      }

      // 3. Ajouter chaque batch à la queue
      for (const batch of batches) {
        await this.priceCheckQueue.add('check-batch', { cmcIds: batch });
      }

      this.logger.log(`Added ${batches.length} batch(es) to price-check queue`);
    } catch (error) {
      this.logger.error('Error in scheduled price check:', error);
    }
  }

  /**
   * Récupère tous les tokens uniques (cmcId) qui ont des alertes actives
   * Deux sources :
   * 1. Strategies avec des steps pending
   * 2. TPAlerts actives
   */
  private async getUniqueTokensWithActiveAlerts(): Promise<number[]> {
    const cmcIds = new Set<number>();

    try {
      // 1. Récupérer les tokens depuis les stratégies actives avec steps pending
      const activeStrategies = await this.prisma.strategy.findMany({
        where: {
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

      // Pour chaque stratégie, récupérer le cmcId du token
      for (const strategy of activeStrategies) {
        if (strategy.steps.length > 0) {
          // Récupérer le cmcId depuis les transactions de l'utilisateur avec ce symbol
          const transaction = await this.prisma.transaction.findFirst({
            where: {
              userId: strategy.userId,
              symbol: strategy.asset,
            },
            select: {
              cmcId: true,
            },
          });

          if (transaction && transaction.cmcId) {
            cmcIds.add(transaction.cmcId);
          }
        }
      }

      // 2. Récupérer les tokens depuis les StepAlerts actives (nouvelle structure)
      const activeStepAlerts = await this.prisma.stepAlert.findMany({
        where: {
          tpReachedEnabled: true,
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

      for (const stepAlert of activeStepAlerts) {
        if (stepAlert.step.strategy.strategyAlert?.isActive) {
          // Récupérer le cmcId depuis la table Token
          const token = await this.prisma.token.findFirst({
            where: {
              symbol: stepAlert.step.strategy.asset,
            },
            select: {
              cmcId: true,
            },
          });

          if (token?.cmcId) {
            cmcIds.add(token.cmcId);
          }
        }
      }

      return Array.from(cmcIds);
    } catch (error) {
      this.logger.error('Error getting unique tokens with active alerts:', error);
      return [];
    }
  }
}

