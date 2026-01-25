import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    // Verify merchant exists
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: dto.merchantId },
    });

    if (!merchant || !merchant.isOpen) {
      throw new BadRequestException('Merchant is not available');
    }

    // Verify address belongs to customer
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, customerId: customer.id },
    });

    if (!address) {
      throw new BadRequestException('Invalid delivery address');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId, merchantId: dto.merchantId },
      });

      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Item ${item.menuItemId} is not available`);
      }

      subtotal += menuItem.price * item.quantity;
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
      });
    }

    const deliveryFee = 50; // Flat fee for now
    const total = subtotal + deliveryFee;

    const order = await this.prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: customer.id,
        merchantId: dto.merchantId,
        addressId: dto.addressId,
        subtotal,
        deliveryFee,
        total,
        specialInstructions: dto.specialInstructions,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        customer: { include: { user: true } },
        merchant: { include: { user: true } },
        items: { include: { menuItem: true } },
        address: true,
      },
    });

    // Notify merchant via Socket
    this.socketGateway.emitOrderCreated(order);

    return order;
  }

  async findAll(userId: string, role: UserRole) {
    const where: any = {};

    if (role === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({ where: { userId } });
      where.customerId = customer.id;
    } else if (role === UserRole.MERCHANT) {
      const merchant = await this.prisma.merchant.findUnique({ where: { userId } });
      where.merchantId = merchant.id;
    } else if (role === UserRole.RIDER) {
      const rider = await this.prisma.rider.findUnique({ where: { userId } });
      where.OR = [{ riderId: rider.id }, { status: OrderStatus.READY_FOR_PICKUP }];
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: true,
        merchant: true,
        items: { include: { menuItem: true } },
        address: true,
        rider: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: { include: { user: true } },
        merchant: { include: { user: true } },
        items: { include: { menuItem: true } },
        address: true,
        rider: { include: { user: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Permission check
    if (role === UserRole.CUSTOMER && order.customer.userId !== userId) throw new ForbiddenException();
    if (role === UserRole.MERCHANT && order.merchant.userId !== userId) throw new ForbiddenException();
    if (role === UserRole.RIDER && order.riderId && order.rider.userId !== userId) throw new ForbiddenException();

    return order;
  }

  async updateStatus(id: string, userId: string, role: UserRole, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id, userId, role);
    const status = dto.status as OrderStatus;

    // Validate state transitions
    // ... (simplified for now)

    const updateData: any = { status };

    if (status === OrderStatus.CONFIRMED) updateData.confirmedAt = new Date();
    if (status === OrderStatus.PREPARING) updateData.preparingAt = new Date();
    if (status === OrderStatus.READY_FOR_PICKUP) updateData.readyAt = new Date();
    if (status === OrderStatus.PICKED_UP) updateData.pickedUpAt = new Date();
    if (status === OrderStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'PAID';
    }
    if (status === OrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = dto.reason;
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: { include: { user: true } },
        merchant: { include: { user: true } },
        rider: { include: { user: true } },
      },
    });

    // Notify all parties via Socket
    this.socketGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  async acceptOrder(id: string, userId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
    });

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.status !== OrderStatus.READY_FOR_PICKUP || order.riderId) {
      throw new BadRequestException('Order is not available for pickup');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        riderId: rider.id,
        status: OrderStatus.DELIVERING,
      },
      include: {
        customer: { include: { user: true } },
        merchant: { include: { user: true } },
        rider: { include: { user: true } },
      },
    });

    this.socketGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }
}
