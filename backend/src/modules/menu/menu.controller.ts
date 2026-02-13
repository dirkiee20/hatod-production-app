import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';

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

  @Delete('categories/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.menuService.deleteCategory(req.user.userId, id);
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
  @ApiOperation({ summary: 'Get menu items by merchant ID (Public)' })
  getMenuItemsByMerchant(@Param('merchantId') merchantId: string) {
    return this.menuService.getMenuItemsByMerchantId(merchantId, true);
  }

  @Get('public/items/:id')
  @ApiOperation({ summary: 'Get menu item by ID (Public)' })
  getMenuItemPublic(@Param('id') id: string) {
    return this.menuService.getMenuItemById(id, true);
  }

  @Get('admin/items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get menu item by ID (Admin)' })
  getMenuItemAdmin(@Param('id') id: string) {
      return this.menuService.getMenuItemById(id, false);
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
      return this.menuService.updateMenuItem(req.user, id, updateDto);
  }
}
