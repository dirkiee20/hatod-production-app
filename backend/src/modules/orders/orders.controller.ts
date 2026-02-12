import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('admin/list')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  findAllAdmin() {
    return this.ordersService.findAllAdmin();
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order' })
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for the current user' })
  findAll(@Req() req: any) {
    return this.ordersService.findAll(req.user.userId, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, req.user.userId, req.user.role, dto);
  }

  @Patch(':id/accept')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Rider accepts an order for delivery' })
  acceptOrder(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.acceptOrder(id, req.user.userId);
  }

  @Patch(':id/claim')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Rider claims an order' })
  claimOrder(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.claimOrder(id, req.user.userId);
  }

  @Patch(':id/assign-rider')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Merchant assigns a rider to an order' })
  assignRider(
    @Param('id') id: string,
    @Body('riderId') riderId: string,
  ) {
    return this.ordersService.assignRider(id, riderId);
  }
}
