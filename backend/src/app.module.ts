
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { RidersModule } from './modules/riders/riders.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MenuModule } from './modules/menu/menu.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { SocketModule } from './modules/socket/socket.module';
import { QueuesModule } from './modules/queues/queues.module';
import { FilesModule } from './modules/files/files.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressModule } from './modules/address/address.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DeliveryFeeModule } from './modules/delivery-fee/delivery-fee.module';
import { PabiliRequestsModule } from './modules/pabili-requests/pabili-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RedisModule,
    SocketModule,
    QueuesModule.forRoot(),
    AuthModule,
    UsersModule,
    CustomersModule,
    RidersModule,
    MerchantsModule,
    OrdersModule,
    MenuModule,
    NotificationsModule,
    FilesModule,
    CartModule,
    AddressModule,
    ReviewsModule,
    DeliveryFeeModule,
    PabiliRequestsModule,
  ],
})
export class AppModule {}
