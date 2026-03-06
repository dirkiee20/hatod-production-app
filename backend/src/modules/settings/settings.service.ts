import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

export interface LegalPoliciesConfig {
  termsUrl: string;
  privacyUrl: string;
  termsVersion: string;
  privacyVersion: string;
  effectiveDate: string;
  accountDeletionInfoUrl: string;
  supportEmail: string;
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
  constructor(
    private redis: RedisService,
    private configService: ConfigService,
  ) {}

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

  getLegalPolicies(): LegalPoliciesConfig {
    return {
      termsUrl:
        this.configService.get<string>('LEGAL_TERMS_URL') ??
        'https://hatod.app/terms',
      privacyUrl:
        this.configService.get<string>('LEGAL_PRIVACY_URL') ??
        'https://hatod.app/privacy',
      termsVersion:
        this.configService.get<string>('LEGAL_TERMS_VERSION') ?? '2026-02-01',
      privacyVersion:
        this.configService.get<string>('LEGAL_PRIVACY_VERSION') ?? '2026-02-01',
      effectiveDate:
        this.configService.get<string>('LEGAL_EFFECTIVE_DATE') ?? '2026-02-01',
      accountDeletionInfoUrl:
        this.configService.get<string>('LEGAL_ACCOUNT_DELETION_URL') ??
        'https://hatod.app/account-deletion',
      supportEmail:
        this.configService.get<string>('LEGAL_SUPPORT_EMAIL') ??
        'hatodservices@gmail.com',
    };
  }
}
