import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { merchant: true }
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== customer.id) throw new ForbiddenException('You can only review your own orders');
    if (order.status !== 'DELIVERED') throw new BadRequestException('Order must be delivered before reviewing');

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { orderId: dto.orderId }
    });
    if (existingReview) throw new BadRequestException('Order already reviewed');

    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        customerId: customer.id,
        rating: dto.rating,
        comment: dto.comment,
      }
    });

    // Update Merchant Rating
    await this.updateMerchantRating(order.merchantId);

    return review;
  }

  private async updateMerchantRating(merchantId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        order: { merchantId }
      }
    });

    const total = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const avg = reviews.length > 0 ? total / reviews.length : 0;

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { rating: avg }
    });
  }

  async findByMerchant(merchantId: string) {
    return this.prisma.review.findMany({
      where: {
        order: { merchantId }
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
