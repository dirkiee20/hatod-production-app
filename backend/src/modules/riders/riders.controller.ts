
import { Controller, Get, Query, UseGuards, Patch, Body, Req } from '@nestjs/common';
import { RidersService } from './riders.service';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, RiderStatus } from '@prisma/client';

@ApiTags('riders')
@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Patch('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider status (AVAILABLE/OFFLINE/BUSY)' })
  @ApiBearerAuth()
  updateStatus(@Req() req: any, @Body('status') status: RiderStatus) {
    return this.ridersService.updateStatus(req.user.userId, status);
  }

  @Patch('location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider location' })
  @ApiBearerAuth()
  updateLocation(@Req() req: any, @Body() body: { lat: number, lng: number }) {
    return this.ridersService.updateLocation(req.user.userId, body.lat, body.lng);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all riders (Admin only)' })
  @ApiBearerAuth()
  getAllRiders() {
    return this.ridersService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('available')
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Find available riders near a location' })
  @ApiQuery({ name: 'lat', required: false, type: Number })
  @ApiQuery({ name: 'lng', required: false, type: Number })
  findAllAvailable(
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    const latitude = lat ? Number(lat) : undefined;
    const longitude = lng ? Number(lng) : undefined;
    return this.ridersService.findAllAvailable(latitude, longitude);
  }
}
