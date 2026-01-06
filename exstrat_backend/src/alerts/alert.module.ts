import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../common/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertService } from './alert.service';
import { EmailProcessor } from '../email/email.processor';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'send-email',
    }),
  ],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}


