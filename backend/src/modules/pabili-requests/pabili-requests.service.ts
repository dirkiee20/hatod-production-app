import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { CreatePabiliRequestDto } from './dto/create-pabili-request.dto';
import { QuotePabiliRequestDto } from './dto/quote-pabili-request.dto';

@Injectable()
export class PabiliRequestsService {
  constructor(
    private prisma: PrismaService,
    private socketGateway: SocketGateway,
  ) {}

  async create(userId: string, createDto: CreatePabiliRequestDto) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const request = await this.prisma.pabiliRequest.create({
      data: {
        customerId: customer.id,
        items: createDto.items,
        estimatedItemCost: createDto.estimatedItemCost,
        status: 'PENDING_REVIEW',
      },
      include: {
        customer: true,
      },
    });

    // Notify admins about the new request
    this.socketGateway.emitToRole('ADMIN', 'new_pabili_request', request);

    return request;
  }

  async findAllForAdmin() {
    return this.prisma.pabiliRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { phone: true, email: true } },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            riderId: true,
          }
        }
      },
    });
  }

  async findAllForCustomer(userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.pabiliRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.pabiliRequest.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { phone: true, email: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException('Pabili Request not found');
    return request;
  }

  async quoteRequest(id: string, quoteDto: QuotePabiliRequestDto) {
    const request = await this.findOne(id);
    
    // Update the request with the quoted service fee and change status
    const updatedRequest = await this.prisma.pabiliRequest.update({
      where: { id },
      data: {
        serviceFee: quoteDto.serviceFee,
        status: 'QUOTED',
      },
    });

    // Emitting to the specific customer using their userId directly.
    // The SocketGateway needs to have emitToUser
    const customer = await this.prisma.customer.findUnique({ where: { id: request.customerId }});
    if (customer) {
        this.socketGateway.emitToUser(customer.userId, 'pabili_request_quoted', updatedRequest);
    }

    return updatedRequest;
  }
}
