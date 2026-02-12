import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    console.log(`[AddressService] Creating address for UserID: ${userId}`);
    // Find customer profile linked to this user
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      console.log(`[AddressService] Customer not found for UserID: ${userId}`);
      throw new NotFoundException('Customer profile not found. Please complete your profile.');
    }

    const address = await this.prisma.address.create({
      data: {
        label: dto.label,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        instructions: dto.instructions,
        customerId: customer.id,
      },
    });
    console.log(`[AddressService] Created AddressID: ${address.id}`);
    return address;
  }

  async findAll(userId: string) {
    console.log(`[AddressService] Finding addresses for UserID: ${userId}`);
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      console.log(`[AddressService] Customer not found for UserID in findAll: ${userId}`);
      return [];
    }

    const addresses = await this.prisma.address.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[AddressService] Found ${addresses.length} addresses`);
    return addresses;
  }
}
