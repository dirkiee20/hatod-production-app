import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { PabiliRequestsService } from './pabili-requests.service';
import { CreatePabiliRequestDto } from './dto/create-pabili-request.dto';
import { QuotePabiliRequestDto } from './dto/quote-pabili-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('pabili-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PabiliRequestsController {
  constructor(private readonly pabiliRequestsService: PabiliRequestsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(@Req() req: any, @Body() createDto: CreatePabiliRequestDto) {
    return this.pabiliRequestsService.create(req.user.userId, createDto);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  findAllForAdmin() {
    return this.pabiliRequestsService.findAllForAdmin();
  }

  @Get('customer')
  @Roles(UserRole.CUSTOMER)
  findAllForCustomer(@Req() req: any) {
    return this.pabiliRequestsService.findAllForCustomer(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pabiliRequestsService.findOne(id);
  }

  @Patch(':id/quote')
  @Roles(UserRole.ADMIN)
  quoteRequest(@Param('id') id: string, @Body() quoteDto: QuotePabiliRequestDto) {
    return this.pabiliRequestsService.quoteRequest(id, quoteDto);
  }
}
