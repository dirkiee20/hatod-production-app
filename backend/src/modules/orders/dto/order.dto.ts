import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsObject, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

class OrderItemDto {
  @ApiProperty()
  @IsString()
  menuItemId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Item options (e.g., permit fields)', required: false })
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

export class CreateOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiProperty()
  @IsString()
  addressId: string;

  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pabiliRequestId?: string;

  @ApiProperty({ required: false, enum: PaymentMethod, default: PaymentMethod.CASH_ON_DELIVERY })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiProperty({ required: false, description: 'Customer live location latitude for COD validation' })
  @IsOptional()
  @IsNumber()
  customerLatitude?: number;

  @ApiProperty({ required: false, description: 'Customer live location longitude for COD validation' })
  @IsOptional()
  @IsNumber()
  customerLongitude?: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'CONFIRMED' })
  @IsString()
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
