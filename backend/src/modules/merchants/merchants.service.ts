import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMerchantDto } from './dto/merchant.dto';

@Injectable()
export class MerchantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.merchant.findMany({
      where: {
        isApproved: true,
      },
      include: {
        categories: {
          include: { menuItems: true },
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
          include: { menuItems: { where: { isAvailable: true } } },
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

    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: dto,
    });
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
}
