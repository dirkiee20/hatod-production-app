import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new ForbiddenException('User is not a merchant');
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        merchantId: merchant.id,
      },
    });
  }

  async getCategories(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
        // If not a merchant, maybe return empty or throw? 
        // But maybe we want admin to see categories too?
        // For 'my categories' endpoint, expect merchant.
       throw new ForbiddenException('User is not a merchant');
    }

    return this.prisma.category.findMany({
      where: { merchantId: merchant.id },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new ForbiddenException('User is not a merchant');
    }

    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: Number(dto.price), // Ensure number
        image: dto.image,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable ?? true,
        preparationTime: dto.preparationTime,
        merchantId: merchant.id,
      },
    });
  }

  async getMenuItems(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });

    if (!merchant) {
      throw new ForbiddenException('User is not a merchant');
    }

    // Return items grouped by category or flat? 
    // Let's return flat for now, allow frontend to group.
    return this.prisma.menuItem.findMany({
      where: { merchantId: merchant.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin or Public usage
  async getMenuItemsByMerchantId(merchantId: string) {
    return this.prisma.menuItem.findMany({
      where: { merchantId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMenuItem(userId: string, id: string) {
     const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });
    if (!merchant) throw new ForbiddenException('User is not a merchant');

    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.merchantId !== merchant.id) throw new ForbiddenException('Not your item');

    return this.prisma.menuItem.delete({ where: { id } });
  }

  async updateMenuItem(userId: string, id: string, dto: Partial<CreateMenuItemDto>) {
     const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });
    if (!merchant) throw new ForbiddenException('User is not a merchant');

    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.merchantId !== merchant.id) throw new ForbiddenException('Not your item');

    return this.prisma.menuItem.update({
        where: { id },
        data: {
            ...dto,
            price: dto.price ? Number(dto.price) : undefined
        }
    });
  }
}
