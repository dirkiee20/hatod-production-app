import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get current user cart' })
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('items')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Add item to cart' })
  addToCart(@Req() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, dto);
  }

  @Put('items/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Req() req: any,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.userId, itemId, dto);
  }

  @Delete('items/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(@Req() req: any, @Param('id') itemId: string) {
    return this.cartService.removeItem(req.user.userId, itemId);
  }

  @Delete()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Clear cart' })
  clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user.userId);
  }
}
