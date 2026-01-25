import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      const role = payload.role;

      client.data.userId = userId;
      client.data.role = role;

      this.connectedUsers.set(userId, client.id);

      // Join role-specific room
      client.join(`role:${role}`);
      client.join(`user:${userId}`);

      console.log(`✅ Client connected: ${client.id} (User: ${userId}, Role: ${role})`);
    } catch (error) {
      console.error('Socket authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`❌ Client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Emit to all users with specific role
  emitToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // Emit to all connected clients
  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Order events
  emitOrderCreated(order: any) {
    // Notify merchant
    this.emitToUser(order.merchant.userId, 'order:created', order);
    // Notify available riders
    this.emitToRole('RIDER', 'order:available', order);
  }

  emitOrderUpdated(order: any) {
    // Notify customer
    this.emitToUser(order.customer.userId, 'order:updated', order);
    // Notify merchant
    this.emitToUser(order.merchant.userId, 'order:updated', order);
    // Notify rider if assigned
    if (order.rider) {
      this.emitToUser(order.rider.userId, 'order:updated', order);
    }
  }

  emitRiderLocationUpdate(riderId: string, location: { latitude: number; longitude: number }) {
    // This will be sent to customers tracking their orders
    this.server.emit('rider:location', { riderId, location });
  }

  @SubscribeMessage('rider:updateLocation')
  handleRiderLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { latitude: number; longitude: number },
  ) {
    const userId = client.data.userId;
    const role = client.data.role;

    if (role === 'RIDER') {
      this.emitRiderLocationUpdate(userId, data);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }
}
