
import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryFeeService } from './delivery-fee.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('delivery-fee')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery-fee')
export class DeliveryFeeController {
  constructor(private readonly deliveryFeeService: DeliveryFeeService) {}

  @Get('estimate')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.MERCHANT) 
  @ApiOperation({ summary: 'Estimate delivery fee based on coordinates' })
  async estimateFee(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
    @Query('subtotal') subtotal?: string,
  ) {
    if (!originLat || !originLng || !destLat || !destLng) {
       throw new BadRequestException('Missing coordinates');
    }
    
    const origin = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    const destination = { lat: parseFloat(destLat), lng: parseFloat(destLng) };
    const orderSubtotal = subtotal ? parseFloat(subtotal) : undefined;
    
    return this.deliveryFeeService.calculateDeliveryFee(origin, destination, orderSubtotal);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a delivery fee range configuration with explicit tiers' })
  create(@Body() createDto: { minDistance: number; maxDistance: number; baseFee?: number; tiers?: any[] }) {
    return this.deliveryFeeService.create(createDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all delivery fee configurations' })
  findAll() {
    return this.deliveryFeeService.findAll();
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a delivery fee configuration' })
  update(@Param('id') id: string, @Body() updateDto: { minDistance?: number; maxDistance?: number; baseFee?: number; tiers?: any[] }) {
    return this.deliveryFeeService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a delivery fee configuration' })
  remove(@Param('id') id: string) {
    return this.deliveryFeeService.remove(id);
  }
}
