import { Module, Global } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
