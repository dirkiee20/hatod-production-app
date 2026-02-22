import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, UserRole, RiderStatus } from '@prisma/client';
import { DeliveryFeeService } from '../delivery-fee/delivery-fee.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
    private deliveryFeeService: DeliveryFeeService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    let merchant = null;
    if (!dto.pabiliRequestId && dto.merchantId) {
      // Verify merchant exists
      merchant = await this.prisma.merchant.findUnique({
        where: { id: dto.merchantId },
      });

      if (!merchant || !merchant.isOpen) {
        throw new BadRequestException('Merchant is not available');
      }
    }

    // Verify address belongs to customer
    let address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, customerId: customer.id },
    });

    if (!address) {
      // Fallback: Use the customer's default address if specific ID isn't found
      // This is helpful if frontend sends a stale or mock ID
      address = await this.prisma.address.findFirst({
        where: { customerId: customer.id },
      });
    }

    if (!address) {
      console.log('Order creation failed: No address found for customer ' + customer.id);
      throw new BadRequestException('Invalid delivery address: No address found for this customer');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItemsData = [];
    let deliveryFee = 50;
    
    let pabiliReq = null;
    if (dto.pabiliRequestId) {
        // Handle Pabili Flow
        pabiliReq = await this.prisma.pabiliRequest.findUnique({
            where: { id: dto.pabiliRequestId }
        });
        if (!pabiliReq) throw new NotFoundException('Pabili Request not found');
        
        subtotal = pabiliReq.estimatedItemCost;
        deliveryFee = pabiliReq.serviceFee || 50;

        // Internal items array left empty for Pabili, items are stored on the Request directly
        
        // Mark the request as officially ACCEPTED/Placed
        await this.prisma.pabiliRequest.update({
            where: { id: dto.pabiliRequestId },
            data: { status: 'ACCEPTED' }
        });

    } else {
        // Existing flow for normal food orders
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

        // Calculate Delivery Fee using DeliveryFeeService
        const origin = { lat: merchant.latitude, lng: merchant.longitude };
        const destination = { lat: address.latitude, lng: address.longitude };
        
        try {
          const feeResult = await this.deliveryFeeService.calculateDeliveryFee(origin, destination);
          deliveryFee = feeResult.fee;
        } catch (error) {
          console.error('Failed to calculate delivery fee, using default:', error);
        }
    }
    
    const total = subtotal + deliveryFee;

    const orderData: any = {
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerId: customer.id,
      addressId: dto.addressId,
      subtotal,
      deliveryFee,
      total,
      specialInstructions: dto.specialInstructions,
    };

    if (dto.merchantId) {
        orderData.merchantId = dto.merchantId;
    }
    if (dto.pabiliRequestId) {
        orderData.pabiliRequestId = dto.pabiliRequestId;
    }
    if (orderItemsData.length > 0) {
        orderData.items = { create: orderItemsData };
    }

    const order = await this.prisma.order.create({
      data: orderData,
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
      where.OR = [
        { riderId: rider.id },
        { status: OrderStatus.READY_FOR_PICKUP, riderId: null }
      ];
    }

    const queryOptions: any = {
      where,
      include: {
        customer: true,
        merchant: true,
        items: { include: { menuItem: true } },
        address: true,
        rider: true,
      },
      orderBy: { createdAt: 'desc' },
    };

    // Limit to recent 50 for rider to optimize dashboard load times
    if (role === UserRole.RIDER) {
      queryOptions.take = 50;
    }

    return this.prisma.order.findMany(queryOptions);
  }

  async findAllAdmin() {
    return this.prisma.order.findMany({
      take: 50,
      include: {
        customer: true,
        merchant: true,
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
        review: true,
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
        address: true,
        items: { include: { menuItem: true } },
      },
    });

    // Automatically set Rider back to AVAILABLE if order is completed
    if ((status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) && updatedOrder.riderId) {
       await this.prisma.rider.update({
         where: { id: updatedOrder.riderId },
         data: { status: 'AVAILABLE' },
       });
    }

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
        address: true,
        items: { include: { menuItem: true } },
      },
    });

    this.socketGateway.emitOrderUpdated(updatedOrder);

    return updatedOrder;
  }

  async assignRider(id: string, riderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const rider = await this.prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: true }
    });

    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        riderId: riderId,
        ...(order.pabiliRequestId ? { status: 'PREPARING' } : {}),
      },
      include: {
        customer: { include: { user: true } },
        merchant: { include: { user: true } },
        rider: { include: { user: true } },
        address: true,
        items: { include: { menuItem: true } },
      },
    });

    // Notify rider via Socket
    this.socketGateway.emitOrderUpdated(updatedOrder);
    
    // Specifically notify the assigned rider
    this.socketGateway.emitToUser(rider.userId, 'order:assigned', updatedOrder);

    return updatedOrder;
  }

  // Rider claims an order (self-assignment)
  async claimOrder(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rider = await tx.rider.findUnique({ 
          where: { userId },
          include: {
             orders: {
                 where: { status: { in: [OrderStatus.DELIVERING, OrderStatus.PICKED_UP] } }
             }
          }
      });
      if (!rider) throw new NotFoundException('Rider profile not found');
      
      if (rider.status === RiderStatus.OFFLINE) {
        throw new BadRequestException('Rider is offline');
      }

      if (rider.orders.length > 0) {
          throw new BadRequestException('You have an active delivery in progress');
      }

      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.riderId) throw new BadRequestException('Order already taken');

      // Atomic Update: Set Rider to BUSY
      if (rider.status !== RiderStatus.BUSY) {
          await tx.rider.update({
            where: { id: rider.id },
            data: { status: RiderStatus.BUSY },
          });
      }

      // Assign Rider
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { riderId: rider.id },
        include: {
          customer: { include: { user: true } },
          merchant: { include: { user: true } },
          rider: { include: { user: true } },
          address: true,
          items: { include: { menuItem: true } },
        },
      });

      this.socketGateway.emitOrderUpdated(updatedOrder);
      return updatedOrder;
    });
  }

  async getMerchantAnalytics(userId: string, range: 'week' | 'month' | 'year') {
    const merchant = await this.prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const now = new Date();
    let startDate: Date;
    if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
    } else if (range === 'month') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // All delivered orders for this merchant in the range
    const orders = await this.prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        createdAt: { gte: startDate },
      },
      include: {
        items: { include: { menuItem: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const cancelledOrders = orders.filter(o => o.status === OrderStatus.CANCELLED);

    // KPI calculations
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalOrders = orders.length;
    const avgOrder = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    const cancelRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

    // Chart data
    const chartData: { label: string; value: number }[] = [];
    if (range === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayLabel = days[d.getDay()];
        const dayRevenue = deliveredOrders
          .filter(o => {
            const od = new Date(o.createdAt);
            return od.getDate() === d.getDate() && od.getMonth() === d.getMonth();
          })
          .reduce((sum, o) => sum + o.subtotal, 0);
        chartData.push({ label: dayLabel, value: dayRevenue });
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i -= 5) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        const windowStart = new Date(d);
        windowStart.setDate(d.getDate() - 4);
        const windowRevenue = deliveredOrders
          .filter(o => {
            const od = new Date(o.createdAt);
            return od >= windowStart && od <= d;
          })
          .reduce((sum, o) => sum + o.subtotal, 0);
        chartData.push({ label, value: windowRevenue });
      }
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        const monthRevenue = deliveredOrders
          .filter(o => {
            const od = new Date(o.createdAt);
            return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
          })
          .reduce((sum, o) => sum + o.subtotal, 0);
        chartData.push({ label: months[d.getMonth()], value: monthRevenue });
      }
    }

    // Top selling items
    const itemSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const existing = itemSalesMap.get(item.menuItemId);
        if (existing) {
          existing.sales += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          itemSalesMap.set(item.menuItemId, {
            name: item.menuItem?.name || 'Unknown',
            sales: item.quantity,
            revenue: item.price * item.quantity,
          });
        }
      }
    }
    const topItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Rating from DB
    const rating = merchant.rating ?? 0;

    return {
      totalRevenue,
      totalOrders,
      avgOrder,
      cancelRate,
      rating,
      chartData,
      topItems,
    };
  }

  async getAdminAnalytics(range: 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;
    if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
    } else if (range === 'month') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
    } else {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const [orders, merchantCount, riderCount, customerCount] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true, status: true, subtotal: true, deliveryFee: true, createdAt: true,
          items: {
            select: {
              price: true, quantity: true,
              menuItem: { select: { originalPrice: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.merchant.count({ where: { isApproved: true } }),
      this.prisma.rider.count(),
      this.prisma.customer.count(),
    ]);

    const delivered = orders.filter(o => o.status === OrderStatus.DELIVERED);
    const cancelled = orders.filter(o => o.status === OrderStatus.CANCELLED);

    const totalRevenue = delivered.reduce((s, o) => s + o.subtotal, 0);
    const totalDeliveryFees = delivered.reduce((s, o) => s + o.deliveryFee, 0);
    const totalOrders = orders.length;
    const cancelRate = totalOrders > 0 ? (cancelled.length / totalOrders) * 100 : 0;
    const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;

    // Markup = sum of (orderItem.price - menuItem.originalPrice) * qty
    // Only counted where originalPrice is set (i.e. admin adjusted the price)
    const totalMarkup = delivered.reduce((sum, order) => {
      return sum + order.items.reduce((s, item) => {
        const origPrice = item.menuItem?.originalPrice;
        if (origPrice != null && item.price > origPrice) {
          return s + (item.price - origPrice) * item.quantity;
        }
        return s;
      }, 0);
    }, 0);

    // Revenue chart
    const chartData: { label: string; value: number }[] = [];
    if (range === 'week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const rev = delivered
          .filter(o => {
            const od = new Date(o.createdAt);
            return od.getDate() === d.getDate() && od.getMonth() === d.getMonth();
          })
          .reduce((s, o) => s + o.subtotal, 0);
        chartData.push({ label: days[d.getDay()], value: rev });
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i -= 5) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        const ws = new Date(d); ws.setDate(d.getDate() - 4);
        const rev = delivered
          .filter(o => { const od = new Date(o.createdAt); return od >= ws && od <= d; })
          .reduce((s, o) => s + o.subtotal, 0);
        chartData.push({ label, value: rev });
      }
    } else {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now); d.setMonth(now.getMonth() - i);
        const rev = delivered
          .filter(o => { const od = new Date(o.createdAt); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear(); })
          .reduce((s, o) => s + o.subtotal, 0);
        chartData.push({ label: months[d.getMonth()], value: rev });
      }
    }

    return {
      totalRevenue,
      totalDeliveryFees,
      totalMarkup,
      totalOrders,
      deliveredOrders: delivered.length,
      cancelledOrders: cancelled.length,
      cancelRate,
      avgOrderValue,
      merchantCount,
      riderCount,
      customerCount,
      chartData,
    };
  }
}

