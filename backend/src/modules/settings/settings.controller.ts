import {
  Controller, Get, Patch, Body, UseGuards, Request,
} from '@nestjs/common';
import { SettingsService, TyphoonConfig } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** GET /settings/typhoon — anyone logged in can read the current state */
  @Get('typhoon')
  getTyphoon() {
    return this.settingsService.getTyphoonMode();
  }

  /** PATCH /settings/typhoon — admin only */
  @Patch('typhoon')
  @Roles('ADMIN')
  updateTyphoon(
    @Body() dto: Partial<TyphoonConfig>,
    @Request() req: any,
  ) {
    return this.settingsService.setTyphoonMode(dto, req.user?.email);
  }
}
