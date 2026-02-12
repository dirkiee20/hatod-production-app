
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../socket/socket.module';
import { DeliveryFeeModule } from '../delivery-fee/delivery-fee.module';

@Module({
  imports: [AuthModule, SocketModule, DeliveryFeeModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
