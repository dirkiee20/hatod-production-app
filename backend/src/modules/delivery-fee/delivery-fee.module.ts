
import { Module } from '@nestjs/common';
import { DeliveryFeeService } from './delivery-fee.service';
import { DeliveryFeeController } from './delivery-fee.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [DeliveryFeeController],
  providers: [DeliveryFeeService],
  exports: [DeliveryFeeService],
})
export class DeliveryFeeModule {}
