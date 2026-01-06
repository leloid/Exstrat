import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TokensModule } from './tokens/tokens.module';
import { TransactionsModule } from './transactions/transactions.module';
import { StrategiesModule } from './strategies/strategies.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { ConfigurationModule } from './configuration/configuration.module';
import { RedisModule } from './common/redis/redis.module';
import { PriceModule } from './price/price.module';
import { AlertModule } from './alerts/alert.module';
import { EmailModule } from './email/email.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    TokensModule,
    TransactionsModule,
    StrategiesModule,
    PortfoliosModule,
    ConfigurationModule,
    PriceModule,
    AlertModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
