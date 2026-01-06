import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../common/redis/redis.module';
import { TokensModule } from '../tokens/tokens.module';
import { AlertModule } from '../alerts/alert.module';
import { PriceService } from './price.service';
import { PriceProcessor } from './price.processor';
import { PriceCheckerScheduler } from './price-checker.scheduler';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    TokensModule,
    AlertModule,
    BullModule.registerQueue({
      name: 'price-check',
    }),
  ],
  providers: [PriceService, PriceProcessor, PriceCheckerScheduler],
  exports: [PriceService],
})
export class PriceModule {}

