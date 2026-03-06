import { IsBoolean, IsDateString, IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '09123456789' })
  @IsPhoneNumber('PH')
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  // Merchant specific fields
  @ApiProperty({ example: 'My Restaurant', required: false })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Manila', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  consentGiven?: boolean;

  @ApiProperty({ example: '2026-02-01', required: false })
  @IsOptional()
  @IsString()
  termsOfServiceVersion?: string;

  @ApiProperty({ example: '2026-02-01', required: false })
  @IsOptional()
  @IsString()
  privacyPolicyVersion?: string;

  @ApiProperty({ example: '2026-03-05T12:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  consentAcceptedAt?: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsOptional()
  @IsString()
  consentAppVersion?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+639123456789', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
