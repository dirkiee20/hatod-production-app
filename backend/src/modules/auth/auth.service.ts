import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    let email = dto.email;
    if (!email) {
        if (!dto.phone) throw new BadRequestException('Email or Phone is required');
        // Use phone as email
        const cleanPhone = dto.phone.replace(/[^0-9]/g, '');
        email = `${cleanPhone}@phone.hatod`;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
            { email },
            dto.phone ? { phone: dto.phone } : { email }
        ]
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email,
          phone: dto.phone,
          password: hashedPassword,
          role: dto.role,
        },
      });

      // Role based profile creation
      if (dto.role === UserRole.CUSTOMER) {
        await tx.customer.create({
          data: {
            userId: user.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        });
      } else if (dto.role === UserRole.RIDER) {
        await tx.rider.create({
          data: {
            userId: user.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            vehicleType: 'Motorcycle', // Default
          },
        });
      } else if (dto.role === UserRole.MERCHANT) {
        if (!dto.merchantName) {
          throw new BadRequestException('Merchant name is required');
        }
        await tx.merchant.create({
          data: {
            userId: user.id,
            name: dto.merchantName,
            address: dto.address || 'Pending Setup',
            phone: dto.phone || 'N/A',
            city: dto.city || 'Unknown', // Placeholder
            state: 'Unknown',
            latitude: 0,
            longitude: 0,
          },
        });
      }

      return this.generateTokens(user.id, user.email, user.role, tx);
    });
  }

  async login(dto: LoginDto) {
    let user;
    
    if (dto.phone) {
      user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
    } else if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    } else {
      throw new BadRequestException('Email or Phone number is required');
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  private async generateTokens(userId: string, email: string, role: string, tx?: any) {
    const client = tx || this.prisma;
    const payload = { sub: userId, email, role, nonce: Math.random() };
    
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    // Store refresh token in DB
    // Clear existing tokens for this user (optional: strictly one session per user for now to avoid issues)
    await client.refreshToken.deleteMany({ where: { userId } });
    
    await client.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userId,
        email,
        role,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Delete old token
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

      return this.generateTokens(payload.sub, payload.email, payload.role);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }
}
