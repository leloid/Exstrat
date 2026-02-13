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
    try {
      const prices = await this.priceService.getBatchPrices(cmcIds);
      for (const [cmcId, currentPrice] of prices.entries()) {
        try {
          await this.alertService.checkAlertsForToken(cmcId, currentPrice);
        } catch (error) {
          this.logger.error(`Alert check failed token ${cmcId}:`, error);
        }
      }
      this.logger.log(`Price check: ${cmcIds.length} tokens`);
    } catch (error) {
      this.logger.error(`Price check job failed:`, error);
      throw error;
    }
  }
}

