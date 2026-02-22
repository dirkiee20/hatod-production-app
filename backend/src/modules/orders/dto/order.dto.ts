import { IsString, IsArray, ValidateNested, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty()
  @IsUUID()
  menuItemId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  merchantId: string;

  @ApiProperty()
  @IsUUID()
  addressId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
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
