import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisEnabled = this.configService.get('REDIS_ENABLED', 'true') === 'true';
    
    if (!redisEnabled) {
      this.logger.warn('Redis is disabled. Set REDIS_ENABLED=true to enable.');
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: this.configService.get('REDIS_HOST') || 'localhost',
          port: this.configService.get('REDIS_PORT') || 6379,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.warn('Redis connection failed after 10 retries. Redis features will be disabled.');
              this.isConnected = false;
              return false; // Stop retrying
            }
            return Math.min(retries * 100, 3000); // Exponential backoff, max 3s
          },
        },
        password: this.configService.get('REDIS_PASSWORD') || undefined,
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis Client Error:', err.message);
        this.isConnected = false;
      });
      
      this.client.on('connect', () => {
        this.logger.log('✅ Redis connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.logger.warn('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      this.logger.warn(`Failed to connect to Redis: ${error.message}. Redis features will be disabled.`);
      this.isConnected = false;
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.logger.log('❌ Redis disconnected');
      } catch (error) {
        this.logger.error('Error disconnecting Redis:', error.message);
      }
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  private checkConnection(): boolean {
    if (!this.client || !this.isConnected) {
      this.logger.debug('Redis is not connected. Operation skipped.');
      return false;
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.checkConnection()) return null;
    try {
      const result = await this.client!.get(key);
      return result as string | null;
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.checkConnection()) return;
    try {
      if (ttl) {
        await this.client!.setEx(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}:`, error.message);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.checkConnection()) return;
    try {
      await this.client!.del(key);
    } catch (error) {
      this.logger.error(`Redis del error for key ${key}:`, error.message);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.checkConnection()) return false;
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis exists error for key ${key}:`, error.message);
      return false;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.checkConnection()) return;
    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
      }
    } catch (error) {
      this.logger.error(`Redis invalidatePattern error for pattern ${pattern}:`, error.message);
    }
  }
}
