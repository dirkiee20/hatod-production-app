import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  async deleteCategory(userId: string, categoryId: string) {
      const merchant = await this.prisma.merchant.findUnique({ where: { userId } });
      if (!merchant) throw new ForbiddenException('User is not a merchant');

      const category = await this.prisma.category.findUnique({
          where: { id: categoryId },
          include: { _count: { select: { menuItems: true } } }
      });

      if (!category) throw new NotFoundException('Category not found');
      if (category.merchantId !== merchant.id) throw new ForbiddenException('Not your category');
      
      if (category._count.menuItems > 0) {
          throw new BadRequestException('Cannot delete category with assigned menu items.');
      }

      return this.prisma.category.delete({ where: { id: categoryId } });
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
        options: dto.options ?? undefined, // ← was missing!
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
  async getMenuItemsByMerchantId(merchantId: string, publicOnly = false) {
    const where: any = { merchantId };
    if (publicOnly) {
       where.isApproved = true;
       // Do NOT filter isAvailable — show all approved items, mark out-of-stock in the UI
    }
    return this.prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMenuItemById(id: string, publicOnly = false) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { category: true, merchant: true },
    });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    
    if (publicOnly && (!item.isApproved || !item.isAvailable)) {
        // If public requested but not approved/available, treat as not found
         throw new NotFoundException('Menu item not found');
    }
    
    return item;
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

  async updateMenuItem(user: { userId: string; role: string }, id: string, dto: Partial<CreateMenuItemDto>) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    if (user.role !== 'ADMIN') {
        const merchant = await this.prisma.merchant.findUnique({
            where: { userId: user.userId },
        });
        if (!merchant) throw new ForbiddenException('User is not a merchant');
        if (item.merchantId !== merchant.id) throw new ForbiddenException('Not your item');
    }

    // Determine what to store as originalPrice:
    // Admin path:
    //   - If the DTO already carries originalPrice, use it (frontend computed it correctly)
    //   - Otherwise auto-snapshot: only on the very first adjustment (when db value is null)
    // Merchant path:
    //   - They're resetting their own price, so clear originalPrice
    let resolvedOriginalPrice: number | null | undefined = undefined; // undefined = don't touch the field

    if (dto.price !== undefined) {
        if (user.role === 'ADMIN') {
            if (dto.originalPrice !== undefined) {
                // Frontend explicitly told us what the baseline is — trust it
                resolvedOriginalPrice = dto.originalPrice;
            } else if (item.originalPrice === null || item.originalPrice === undefined) {
                // First-ever admin adjustment — snapshot the current DB price
                resolvedOriginalPrice = item.price;
            }
            // else: originalPrice already set in DB, and DTO didn't send one → leave it alone
        } else {
            // Merchant edited price — they own the new baseline
            resolvedOriginalPrice = null;
        }
    }

    // Strip originalPrice out of dto so we don't double-apply it
    const { originalPrice: _ignored, ...restDto } = dto as any;

    return this.prisma.menuItem.update({
        where: { id },
        data: {
            ...restDto,
            price: dto.price !== undefined ? Number(dto.price) : undefined,
            ...(resolvedOriginalPrice !== undefined ? { originalPrice: resolvedOriginalPrice } : {}),
        }
    });
  }
}
