import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMerchantDto } from './dto/merchant.dto';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MerchantsService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway
  ) {}

  async findAll() {
    return this.prisma.merchant.findMany({
      where: {
        isApproved: true,
      },
      include: {
        categories: {
          include: { menuItems: { where: { isAvailable: true, isApproved: true } } },
        },
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.merchant.findMany({
      include: {
        categories: {
          include: { menuItems: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        categories: {
          include: { menuItems: { where: { isAvailable: true, isApproved: true } } },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return merchant;
  }

  async findOneAdmin(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        categories: {
          include: { menuItems: true }, // Include ALL items
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return merchant;
  }

  async getProfile(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: {
        categories: {
          include: { menuItems: true },
        },
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return merchant;
  }

  async updateMerchant(userId: string, dto: UpdateMerchantDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    const { operatingHours, ...rest } = dto;

    // Strip out null/undefined values — Prisma rejects null for non-nullable fields
    // (e.g. latitude/longitude are Float and cannot be null in the schema)
    const cleanRest = Object.fromEntries(
      Object.entries(rest).filter(([_, v]) => v !== null && v !== undefined)
    );

    const updatedMerchant = await this.prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        ...cleanRest,
        ...(operatingHours !== undefined ? { operatingHours } : {}),
      },
    });

    this.socketGateway.emitMerchantUpdated(updatedMerchant);

    return updatedMerchant;
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant profile not found');
    }

    return this.prisma.menuItem.create({
      data: {
        ...dto,
        merchantId: merchant.id,
      },
    });
  }

  async updateMenuItem(userId: string, itemId: string, dto: Partial<CreateMenuItemDto>) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: { merchant: true },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    if (item.merchant.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: dto,
    });
  }
  async approveMerchant(id: string) {
    return this.prisma.merchant.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async suspendMerchant(id: string) {
    return this.prisma.merchant.update({
      where: { id },
      data: { isApproved: false },
    });
  }

  async updateMerchantById(id: string, dto: UpdateMerchantDto) {
    return this.prisma.merchant.update({
      where: { id },
      data: dto
    });
  }

  async adjustMenuPrices(merchantId: string, percentage: number) {
    const items = await this.prisma.menuItem.findMany({
      where: { merchantId },
    });

    const factor = 1 + percentage / 100;

    for (const item of items) {
      const newPrice = Math.round(item.price * factor * 100) / 100;
      
      let newOptions = item.options;
      if (newOptions && Array.isArray(newOptions)) {
         newOptions = newOptions.map((group: any) => ({
             ...group,
             options: group.options.map((opt: any) => ({
                 ...opt,
                 price: opt.price ? (Math.round(parseFloat(opt.price) * factor * 100) / 100).toString() : '0'
             }))
         }));
      }

      await this.prisma.menuItem.update({
        where: { id: item.id },
        data: {
          price: newPrice,
          options: newOptions ?? undefined,
        }
      });
    }

    return { success: true, count: items.length };
  }

  async approveMenuItem(id: string) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { isApproved: true },
    });
  }
}
