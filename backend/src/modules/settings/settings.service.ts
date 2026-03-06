import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFoodCategoryDto, UpdateFoodCategoryDto } from './dto/food-category.dto';

const TYPHOON_KEY = 'system:typhoon_mode';
const GOVERNMENT_SERVICE_KEY = 'system:government_service';
const PABILI_SERVICE_KEY = 'system:pabili_service';

export interface TyphoonConfig {
  enabled: boolean;
  message: string;
  activatedAt: string | null;
  activatedBy: string | null;
  level: 'SIGNAL_1' | 'SIGNAL_2' | 'SIGNAL_3' | 'SIGNAL_4';
  suspendOrders: boolean;
  suspendDeliveries: boolean;
}

export interface GovernmentServiceConfig {
  enabled: boolean;
  message: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface PabiliServiceConfig {
  enabled: boolean;
  message: string;
  updatedAt: string | null;
  updatedBy: string | null;
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

export interface FoodCategoryConfig {
  id: string;
  name: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

const DEFAULT_GOVERNMENT_SERVICE_CONFIG: GovernmentServiceConfig = {
  enabled: false,
  message: 'Government services are currently unavailable. Please check back later.',
  updatedAt: null,
  updatedBy: null,
};

const DEFAULT_PABILI_SERVICE_CONFIG: PabiliServiceConfig = {
  enabled: false,
  message: 'We Buy For You service is currently unavailable. Please check back later.',
  updatedAt: null,
  updatedBy: null,
};

@Injectable()
export class SettingsService {
  constructor(
    private redis: RedisService,
    private configService: ConfigService,
    private prisma: PrismaService,
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

  async getGovernmentServiceConfig(): Promise<GovernmentServiceConfig> {
    const cached = await this.redis.getJson<GovernmentServiceConfig>(GOVERNMENT_SERVICE_KEY);
    return cached ?? DEFAULT_GOVERNMENT_SERVICE_CONFIG;
  }

  async setGovernmentServiceConfig(
    config: Partial<GovernmentServiceConfig>,
    adminEmail?: string,
  ): Promise<GovernmentServiceConfig> {
    const current = await this.getGovernmentServiceConfig();
    const updated: GovernmentServiceConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail ?? 'admin',
    };
    await this.redis.setJson(GOVERNMENT_SERVICE_KEY, updated);
    return updated;
  }

  async getPabiliServiceConfig(): Promise<PabiliServiceConfig> {
    const cached = await this.redis.getJson<PabiliServiceConfig>(PABILI_SERVICE_KEY);
    return cached ?? DEFAULT_PABILI_SERVICE_CONFIG;
  }

  async setPabiliServiceConfig(
    config: Partial<PabiliServiceConfig>,
    adminEmail?: string,
  ): Promise<PabiliServiceConfig> {
    const current = await this.getPabiliServiceConfig();
    const updated: PabiliServiceConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail ?? 'admin',
    };
    await this.redis.setJson(PABILI_SERVICE_KEY, updated);
    return updated;
  }

  getLegalPolicies(): LegalPoliciesConfig {
    return {
      termsUrl:
        this.configService.get<string>('LEGAL_TERMS_URL') ??
        'https://hatodlegalcenter-production.up.railway.app/terms.html',
      privacyUrl:
        this.configService.get<string>('LEGAL_PRIVACY_URL') ??
        'https://hatodlegalcenter-production.up.railway.app/terms.html',
      termsVersion:
        this.configService.get<string>('LEGAL_TERMS_VERSION') ?? '2026-03-01',
      privacyVersion:
        this.configService.get<string>('LEGAL_PRIVACY_VERSION') ?? '2026-03-01',
      effectiveDate:
        this.configService.get<string>('LEGAL_EFFECTIVE_DATE') ?? '2026-03-01',
      accountDeletionInfoUrl:
        this.configService.get<string>('LEGAL_ACCOUNT_DELETION_URL') ??
        'https://hatodlegalcenter-production.up.railway.app/account-deletion.html',
      supportEmail:
        this.configService.get<string>('LEGAL_SUPPORT_EMAIL') ??
        'hatodservices@gmail.com',
    };
  }

  async getFoodCategories(includeInactive = false): Promise<FoodCategoryConfig[]> {
    return this.prisma.foodCategorySetting.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createFoodCategory(dto: CreateFoodCategoryDto): Promise<FoodCategoryConfig> {
    const name = this.normalizeCategoryName(dto.name);
    const imageUrl = this.normalizeImageUrl(dto.imageUrl);
    await this.assertUniqueCategoryName(name);

    return this.prisma.foodCategorySetting.create({
      data: {
        name,
        imageUrl,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateFoodCategory(id: string, dto: UpdateFoodCategoryDto): Promise<FoodCategoryConfig> {
    const existing = await this.prisma.foodCategorySetting.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Food category not found');
    }

    const data: Partial<FoodCategoryConfig> = {};

    if (dto.name !== undefined) {
      const normalizedName = this.normalizeCategoryName(dto.name);
      await this.assertUniqueCategoryName(normalizedName, id);
      data.name = normalizedName;
    }

    if (dto.imageUrl !== undefined) {
      data.imageUrl = this.normalizeImageUrl(dto.imageUrl);
    }
    if (dto.sortOrder !== undefined) {
      data.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return this.prisma.foodCategorySetting.update({
      where: { id },
      data,
    });
  }

  async deleteFoodCategory(id: string): Promise<{ success: true }> {
    const existing = await this.prisma.foodCategorySetting.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Food category not found');
    }

    await this.prisma.foodCategorySetting.delete({ where: { id } });
    return { success: true };
  }

  private normalizeCategoryName(name: string): string {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) throw new BadRequestException('Category name is required');
    return normalized;
  }

  private normalizeImageUrl(imageUrl: string): string {
    const normalized = imageUrl.trim();
    if (!normalized) throw new BadRequestException('Category image URL is required');
    return normalized;
  }

  private async assertUniqueCategoryName(name: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.foodCategorySetting.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Food category name already exists');
    }
  }
}
