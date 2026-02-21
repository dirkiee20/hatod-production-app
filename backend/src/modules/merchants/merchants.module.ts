import { Module } from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { AuthModule } from '../auth/auth.module';
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [AuthModule, SocketModule],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
