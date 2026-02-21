import { IsNumber, IsOptional, ValidateNested, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DeliveryFeeTierDto {
  @IsNumber()
  minOrderAmount: number;

  @IsOptional()
  @IsNumber()
  maxOrderAmount?: number;

  @IsNumber()
  fee: number;
}

export class CreateDeliveryFeeDto {
  @IsNumber()
  minDistance: number;

  @IsNumber()
  maxDistance: number;

  @IsOptional()
  @IsNumber()
  baseFee?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryFeeTierDto)
  tiers?: DeliveryFeeTierDto[];
}

export class UpdateDeliveryFeeDto {
  @IsOptional()
  @IsNumber()
  minDistance?: number;

  @IsOptional()
  @IsNumber()
  maxDistance?: number;

  @IsOptional()
  @IsNumber()
  baseFee?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryFeeTierDto)
  tiers?: DeliveryFeeTierDto[];
}
