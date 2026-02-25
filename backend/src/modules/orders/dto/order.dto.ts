import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ type: 'object' })
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
