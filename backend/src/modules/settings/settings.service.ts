import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const TYPHOON_KEY = 'system:typhoon_mode';

export interface TyphoonConfig {
  enabled: boolean;
  message: string;
  activatedAt: string | null;
  activatedBy: string | null;
  level: 'SIGNAL_1' | 'SIGNAL_2' | 'SIGNAL_3' | 'SIGNAL_4';
  suspendOrders: boolean;
  suspendDeliveries: boolean;
}

const DEFAULT_CONFIG: TyphoonConfig = {
  enabled: false,
  message: 'Service is temporarily suspended due to typhoon. Please stay safe.',
  activatedAt: null,
  activatedBy: null,
  level: 'SIGNAL_1',
  suspendOrders: true,
  suspendDeliveries: true,
};

@Injectable()
export class SettingsService {
  constructor(private redis: RedisService) {}

  async getTyphoonMode(): Promise<TyphoonConfig> {
    const cached = await this.redis.getJson<TyphoonConfig>(TYPHOON_KEY);
    return cached ?? DEFAULT_CONFIG;
  }

  async setTyphoonMode(
    config: Partial<TyphoonConfig>,
    adminEmail?: string,
  ): Promise<TyphoonConfig> {
    const current = await this.getTyphoonMode();
    const updated: TyphoonConfig = {
      ...current,
      ...config,
      activatedAt: config.enabled ? new Date().toISOString() : null,
      activatedBy: config.enabled ? (adminEmail ?? 'admin') : null,
    };
    await this.redis.setJson(TYPHOON_KEY, updated);
    return updated;
  }
}
