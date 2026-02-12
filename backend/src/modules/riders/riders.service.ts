
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { RiderStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class RidersService {
  constructor(private prisma: PrismaService, private socketGateway: SocketGateway) {}

  async updateStatus(userId: string, status: RiderStatus) {
    const rider = await this.prisma.rider.findUnique({ where: { userId } });
    if (!rider) throw new NotFoundException('Rider profile not found');
    
    return this.prisma.rider.update({
      where: { userId },
      data: { status },
    });
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    const updatedRider = await this.prisma.rider.update({
      where: { userId },
      data: { currentLatitude: lat, currentLongitude: lng },
    });
    
    // Broadcast location update
    this.socketGateway.emitRiderLocationUpdate(updatedRider.id, { latitude: lat, longitude: lng });
    
    return updatedRider;
  }

  async findAllAvailable(latitude?: number, longitude?: number) {
    // Fetch all available riders
    // Fetch all available riders (including BUSY ones, unless they are delivering)
    const riders = await this.prisma.rider.findMany({
      where: {
        status: { in: [RiderStatus.AVAILABLE, RiderStatus.BUSY] },
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          }
        },
        orders: {
          where: {
            status: { in: [OrderStatus.DELIVERING, OrderStatus.PICKED_UP] }
          },
          select: { id: true }
        }
      }
    });

    // Filter out riders who are currently delivering
    const availableRiders = riders.filter(r => r.orders.length === 0);

    if (!latitude || !longitude) {
      return availableRiders;
    }

    // Filter by distance (Simple Haversine)
    // Radius: 5km
    const MAX_DISTANCE_KM = 5;

    return availableRiders.filter(rider => {
      if (!rider.currentLatitude || !rider.currentLongitude) return false;
      const dist = this.getDistanceFromLatLonInKm(
        latitude,
        longitude,
        rider.currentLatitude,
        rider.currentLongitude,
      );
      return dist <= MAX_DISTANCE_KM;
    });
  }


  async findAll() {
    return this.prisma.rider.findMany({
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          }
        },
        orders: {
          where: {
            status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP, OrderStatus.DELIVERING] }
          },
          select: { 
            id: true,
            status: true,
            merchant: { select: { name: true } }
          }
        }
      }
    });
  }

  private getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
