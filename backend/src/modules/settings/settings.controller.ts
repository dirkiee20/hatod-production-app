import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SettingsService, TyphoonConfig } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

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
}
