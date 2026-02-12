
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

  async calculateDeliveryFee(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<{ fee: number; distance: number; duration: number }> {
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
      // We look for a range that covers this distance
      // We want to handle "gaps" or "out of bounds" gracefully
      const configs = await this.prisma.deliveryFeeConfig.findMany({
        orderBy: { minDistance: 'asc' }
      });

      let fee = 0;
      const matchedConfig = configs.find(c => distanceInKm >= c.minDistance && distanceInKm < c.maxDistance);

      if (matchedConfig) {
        fee = matchedConfig.fee;
      } else if (configs.length > 0) {
        // If distance > max defined, use the fee of the largest range
        // Or check if it's below min (shouldn't happen if min is 0)
        const lastConfig = configs[configs.length - 1];
        if (distanceInKm >= lastConfig.maxDistance) {
           fee = lastConfig.fee; // Or add extra logic here
        } else {
           // Should ideally be covered by a range
           fee = configs[0].fee; 
        }
      } else {
        // No configs found
        fee = 50; // Default fallback
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
    });
  }

  async create(data: { minDistance: number; maxDistance: number; fee: number }) {
    return this.prisma.deliveryFeeConfig.create({ data });
  }

  async update(id: string, data: { minDistance?: number; maxDistance?: number; fee?: number }) {
    return this.prisma.deliveryFeeConfig.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.deliveryFeeConfig.delete({ where: { id } });
  }
}
