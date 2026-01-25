import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCategory(@Req() req: any, @Body() createCategoryDto: CreateCategoryDto) {
    return this.menuService.createCategory(req.user.userId, createCategoryDto);
  }

  @Get('categories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getCategories(@Req() req: any) {
    return this.menuService.getCategories(req.user.userId);
  }

  @Post('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createMenuItem(@Req() req: any, @Body() createMenuItemDto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(req.user.userId, createMenuItemDto);
  }

  @Get('items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMenuItems(@Req() req: any) {
    return this.menuService.getMenuItems(req.user.userId);
  }

  @Get('merchant/:merchantId/items')
  @ApiOperation({ summary: 'Get menu items by merchant ID (Public/Admin)' })
  getMenuItemsByMerchant(@Param('merchantId') merchantId: string) {
    return this.menuService.getMenuItemsByMerchantId(merchantId);
  }

  @Delete('items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteMenuItem(@Req() req: any, @Param('id') id: string) {
    return this.menuService.deleteMenuItem(req.user.userId, id);
  }

  @Patch('items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateMenuItem(@Req() req: any, @Param('id') id: string, @Body() updateDto: Partial<CreateMenuItemDto>) {
      return this.menuService.updateMenuItem(req.user.userId, id, updateDto);
  }
}
