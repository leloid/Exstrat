import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PriceService } from './price.service';
import { AlertService } from '../alerts/alert.service';

interface PriceCheckJob {
  cmcIds: number[];
}

@Processor('price-check')
export class PriceProcessor {
  private readonly logger = new Logger(PriceProcessor.name);

  constructor(
    private readonly priceService: PriceService,
    private readonly alertService: AlertService,
  ) {}

  @Process('check-batch')
  async handlePriceCheck(job: Job<PriceCheckJob>) {
    const { cmcIds } = job.data;
    this.logger.log(`Processing price check for ${cmcIds.length} tokens`);

    try {
      // 1. Récupérer les prix en batch
      const prices = await this.priceService.getBatchPrices(cmcIds);

      // 2. Pour chaque token, vérifier les alertes
      for (const [cmcId, currentPrice] of prices.entries()) {
        try {
          await this.alertService.checkAlertsForToken(cmcId, currentPrice);
        this.logger.debug(`Checked alerts for token ${cmcId} at price $${currentPrice}`);
        } catch (error) {
          this.logger.error(`Error checking alerts for token ${cmcId}:`, error);
          // Continuer avec les autres tokens même en cas d'erreur
        }
      }

      this.logger.log(`Completed price check for ${cmcIds.length} tokens`);
    } catch (error) {
      this.logger.error(`Error processing price check job:`, error);
      throw error; // BullMQ va retry automatiquement
    }
  }
}

