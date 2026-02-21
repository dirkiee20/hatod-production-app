import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let customer = await this.prisma.customer.findUnique({
      where: { userId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                menuItem: {
                    include: {
                        merchant: true
                    }
                }
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!customer) {
      // Auto-create customer profile if missing (resilience)
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      customer = await this.prisma.customer.create({
        data: {
          userId,
          firstName: 'New',
          lastName: 'Customer',
          addresses: {
            create: {
              label: 'Home',
              street: '',
              city: '',
              state: '',
              latitude: 0,
              longitude: 0,
              isDefault: true,
            }
          }
        },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  menuItem: {
                    include: {
                      merchant: true
                    }
                  }
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        }
      });
    }

    // Return cart or create one if not exists (lazy creation)
    if (!customer.cart) {
      return this.prisma.cart.create({
        data: { customerId: customer.id },
        include: { items: { include: { menuItem: { include: { merchant: true } } } } },
      });
    }

    return customer.cart;
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      include: { cart: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    let cart = customer.cart;
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customerId: customer.id },
      });
    }

    // Verify menu item
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    const existingItems = await this.prisma.cartItem.findMany({
      where: {
        cartId: cart.id,
        menuItemId: dto.menuItemId,
      }
    });

    const newOptionsStr = JSON.stringify(dto.options || {});
    
    // Find an item that exactly matches the incoming options
    const existingMatch = existingItems.find(item => {
      const existingOptionsStr = JSON.stringify(item.options || {});
      return existingOptionsStr === newOptionsStr;
    });

    if (existingMatch) {
      // Just merge & increment quantity
      return this.prisma.cartItem.update({
        where: { id: existingMatch.id },
        data: { quantity: existingMatch.quantity + dto.quantity },
        include: { menuItem: true },
      });
    }

    // Otherwise, create a separate cart item entirely
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: dto.menuItemId,
        quantity: dto.quantity,
        options: dto.options || {},
      },
      include: { menuItem: true },
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    // Ensure item belongs to user's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { include: { customer: true } } },
    });

    if (!item || item.cart.customer.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity <= 0) {
      return this.removeItem(userId, itemId);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { include: { customer: true } } },
    });

    if (!item || item.cart.customer.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
      include: { cart: true },
    });

    if (!customer || !customer.cart) return;

    return this.prisma.cartItem.deleteMany({
      where: { cartId: customer.cart.id },
    });
  }
}
