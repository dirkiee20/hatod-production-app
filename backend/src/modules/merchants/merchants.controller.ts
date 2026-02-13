import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from './merchants.service';
import { CreateMenuItemDto, UpdateMerchantDto } from './dto/merchant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/list')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all merchants (Admin only)' })
  findAllAdmin() {
    return this.merchantsService.findAllAdmin();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('profile')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get merchant profile' })
  getProfile(@Req() req: any) {
    return this.merchantsService.getProfile(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active merchants' })
  findAll() {
    return this.merchantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get merchant details and menu' })
  findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get merchant details (Admin only)' })
  findOneAdmin(@Param('id') id: string) {
    return this.merchantsService.findOneAdmin(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('profile')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update merchant profile' })
  updateProfile(@Req() req: any, @Body() dto: UpdateMerchantDto) {
    return this.merchantsService.updateMerchant(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('menu-items')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Add a new menu item' })
  createMenuItem(@Req() req: any, @Body() dto: CreateMenuItemDto) {
    return this.merchantsService.createMenuItem(req.user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('menu-items/:id')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update a menu item' })
  updateMenuItem(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: Partial<CreateMenuItemDto>,
  ) {
    return this.merchantsService.updateMenuItem(req.user.userId, id, dto);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a merchant (Admin only)' })
  approve(@Param('id') id: string) {
    return this.merchantsService.approveMerchant(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/suspend')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend a merchant (Admin only)' })
  suspend(@Param('id') id: string) {
    return this.merchantsService.suspendMerchant(id);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/adjust-prices')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Adjust all menu prices by percentage (Admin only)' })
  adjustPrices(@Param('id') id: string, @Body('percentage') percentage: number) {
    return this.merchantsService.adjustMenuPrices(id, percentage);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('menu-items/:id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a menu item (Admin only)' })
  approveMenuItem(@Param('id') id: string) {
    return this.merchantsService.approveMenuItem(id);
  }
}
