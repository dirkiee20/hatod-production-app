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
}
