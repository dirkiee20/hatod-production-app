import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  GovernmentServiceConfig,
  PabiliServiceConfig,
  SettingsService,
  TyphoonConfig,
} from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateFoodCategoryDto, UpdateFoodCategoryDto } from './dto/food-category.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // GET /settings/legal - public legal policy metadata for app/web clients.
  @Public()
  @Get('legal')
  getLegalPolicies() {
    return this.settingsService.getLegalPolicies();
  }

  // GET /settings/food-categories - public list for customer app.
  @Public()
  @Get('food-categories')
  getPublicFoodCategories() {
    return this.settingsService.getFoodCategories(false);
  }

  // GET /settings/government-service - public availability for customer app.
  @Public()
  @Get('government-service')
  getGovernmentServiceConfig() {
    return this.settingsService.getGovernmentServiceConfig();
  }

  // GET /settings/pabili-service - public availability for customer app.
  @Public()
  @Get('pabili-service')
  getPabiliServiceConfig() {
    return this.settingsService.getPabiliServiceConfig();
  }

  // GET /settings/typhoon - logged in users can read current system state.
  @Get('typhoon')
  getTyphoon() {
    return this.settingsService.getTyphoonMode();
  }

  // PATCH /settings/typhoon - admin only.
  @Patch('typhoon')
  @Roles('ADMIN')
  updateTyphoon(
    @Body() dto: Partial<TyphoonConfig>,
    @Request() req: any,
  ) {
    return this.settingsService.setTyphoonMode(dto, req.user?.email);
  }

  // PATCH /settings/government-service - admin only.
  @Patch('government-service')
  @Roles('ADMIN')
  updateGovernmentService(
    @Body() dto: Partial<GovernmentServiceConfig>,
    @Request() req: any,
  ) {
    return this.settingsService.setGovernmentServiceConfig(dto, req.user?.email);
  }

  // PATCH /settings/pabili-service - admin only.
  @Patch('pabili-service')
  @Roles('ADMIN')
  updatePabiliService(
    @Body() dto: Partial<PabiliServiceConfig>,
    @Request() req: any,
  ) {
    return this.settingsService.setPabiliServiceConfig(dto, req.user?.email);
  }

  // GET /settings/food-categories/admin - admin list (active + inactive).
  @Get('food-categories/admin')
  @Roles('ADMIN')
  getAdminFoodCategories() {
    return this.settingsService.getFoodCategories(true);
  }

  // POST /settings/food-categories - admin create.
  @Post('food-categories')
  @Roles('ADMIN')
  createFoodCategory(@Body() dto: CreateFoodCategoryDto) {
    return this.settingsService.createFoodCategory(dto);
  }

  // PATCH /settings/food-categories/:id - admin update.
  @Patch('food-categories/:id')
  @Roles('ADMIN')
  updateFoodCategory(
    @Param('id') id: string,
    @Body() dto: UpdateFoodCategoryDto,
  ) {
    return this.settingsService.updateFoodCategory(id, dto);
  }

  // DELETE /settings/food-categories/:id - admin delete.
  @Delete('food-categories/:id')
  @Roles('ADMIN')
  deleteFoodCategory(@Param('id') id: string) {
    return this.settingsService.deleteFoodCategory(id);
  }
}
