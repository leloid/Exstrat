import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        // Option 1: URL complète (priorité)
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
          return new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            enableReadyCheck: true,
            enableOfflineQueue: false,
          });
        }

        // Option 2: Configuration séparée (host, port, password, username)
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = parseInt(configService.get<string>('REDIS_PORT') || '6379', 10);
        const password = configService.get<string>('REDIS_PASSWORD');
        const username = configService.get<string>('REDIS_USERNAME'); // Pour Redis 6+ avec ACL

        const config: any = {
          host,
          port,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          enableReadyCheck: true,
          enableOfflineQueue: false,
        };

        if (password) {
          config.password = password;
        }

        if (username) {
          config.username = username;
        }

        return new Redis(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}

