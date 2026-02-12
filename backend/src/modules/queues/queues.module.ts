import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class QueuesModule {
  static forRoot(): DynamicModule {
    // Check if Redis is enabled (default: true)
    const redisEnabled = process.env.REDIS_ENABLED !== 'false';
    
    if (!redisEnabled) {
      console.log('⚠️  Redis is disabled. Queue features will not be available.');
      return {
        module: QueuesModule,
        imports: [],
        exports: [],
      };
    }

    return {
      module: QueuesModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => {
            const connection = {
              host: configService.get('REDIS_HOST') || 'localhost',
              port: configService.get('REDIS_PORT') || 6379,
              password: configService.get('REDIS_PASSWORD'),
              maxRetriesPerRequest: null, // Allow graceful degradation
              retryStrategy: (times: number) => {
                if (times > 10) {
                  console.warn('⚠️  BullMQ: Redis connection failed after 10 retries. Queue features disabled.');
                  return null; // Stop retrying
                }
                return Math.min(times * 100, 3000); // Exponential backoff, max 3s
              },
            };
            return { connection };
          },
          inject: [ConfigService],
        }),
      ],
      exports: [BullModule],
    };
  }
}
