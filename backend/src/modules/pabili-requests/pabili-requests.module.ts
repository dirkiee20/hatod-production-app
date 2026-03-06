import { Module } from '@nestjs/common';
import { PabiliRequestsService } from './pabili-requests.service';
import { PabiliRequestsController } from './pabili-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SocketModule } from '../socket/socket.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SocketModule, SettingsModule],
  controllers: [PabiliRequestsController],
  providers: [PabiliRequestsService],
})
export class PabiliRequestsModule {}
