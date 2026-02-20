
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DeliveryFeeService {
  private readonly logger = new Logger(DeliveryFeeService.name);
  private readonly mapboxToken: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.mapboxToken = this.configService.get<string>('MAPBOX_ACCESS_TOKEN');
    
    if (!this.mapboxToken) {
      this.logger.warn('MAPBOX_ACCESS_TOKEN is not defined in environment variables');
    }
  }

  async calculateDeliveryFee(
    origin: { lat: number; lng: number }, 
    destination: { lat: number; lng: number },
    subtotal?: number
  ): Promise<{ fee: number; distance: number; duration: number }> {
    try {
      if (!this.mapboxToken) {
        throw new Error('Mapbox token missing');
      }

      // Driving Profile: mapbox/driving
      // Coordinates: longitude,latitude
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
      
      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxToken,
          geometries: 'geojson',
          steps: false
        }
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        this.logger.warn('No route found between points');
        // Fallback to Haversine or similar if needed, but for now throw
        // In production, we might want a fallback distance calculation
      }

      const route = response.data.routes[0];
      const distanceInMeters = route.distance;
      const distanceInKm = distanceInMeters / 1000;
      const duration = route.duration; // seconds

      // Get Fee Config
      const configs = await this.prisma.deliveryFeeConfig.findMany({
        orderBy: { minDistance: 'asc' },
        include: { tiers: true }
      });

      let fee = 50; // Ultimate safety fallback
      const matchedConfig = configs.find(c => distanceInKm >= c.minDistance && distanceInKm < c.maxDistance) || (configs.length > 0 && distanceInKm >= configs[configs.length - 1].maxDistance ? configs[configs.length - 1] : null);

      if (matchedConfig) {
        if (subtotal !== undefined && matchedConfig.tiers.length > 0) {
           // Find the tier that matches the subtotal
           const matchedTier = matchedConfig.tiers.find(t => 
             subtotal >= t.minOrderAmount && 
             (t.maxOrderAmount === null || subtotal < t.maxOrderAmount)
           );
           
           if (matchedTier) {
             fee = matchedTier.fee;
           } else {
             fee = matchedConfig.baseFee ?? 50; 
           }
        } else {
           fee = matchedConfig.baseFee ?? 50;
        }
      } else if (configs.length > 0) {
         fee = configs[0].baseFee ?? 50;
      }

      return {
        fee: fee,
        distance: distanceInKm,
        duration: duration
      };

    } catch (error) {
      this.logger.error(`Error calculating fee: ${error.message}`, error.stack);
      // Return a safe default so checkout doesn't crash?
      // Or throw to let the user know?
      // Better to return a default but mark it as estimated or fallback
      return { fee: 50, distance: 0, duration: 0 }; 
    }
  }

  // CRUD for Admin
  async findAll() {
    return this.prisma.deliveryFeeConfig.findMany({
      orderBy: { minDistance: 'asc' },
      include: {
        tiers: {
          orderBy: { minOrderAmount: 'asc' }
        }
      }
    });
  }

  async create(data: { minDistance: number; maxDistance: number; baseFee?: number; tiers?: any[] }) {
    return this.prisma.deliveryFeeConfig.create({ 
      data: {
        minDistance: data.minDistance,
        maxDistance: data.maxDistance,
        baseFee: data.baseFee,
        tiers: {
          create: data.tiers || []
        }
      },
      include: { tiers: true }
    });
  }

  async update(id: string, data: { minDistance?: number; maxDistance?: number; baseFee?: number; tiers?: any[] }) {
    // Basic update for distance. If you need to deeply update tiers,
    // usually you delete old tiers and insert new ones or handle a complex upsert
    if (data.tiers) {
       await this.prisma.deliveryFeeTier.deleteMany({ where: { configId: id } });
    }

    return this.prisma.deliveryFeeConfig.update({
      where: { id },
      data: {
        minDistance: data.minDistance,
        maxDistance: data.maxDistance,
        baseFee: data.baseFee,
        ...(data.tiers && {
           tiers: {
             create: data.tiers
           }
        })
      },
      include: { tiers: true }
    });
  }

  async remove(id: string) {
    return this.prisma.deliveryFeeConfig.delete({ where: { id } });
  }
}
