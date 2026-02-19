import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty, IsArray, Allow } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @Allow()
  originalPrice?: number | null;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
  
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;

  @IsNumber()
  @IsOptional()
  preparationTime?: number;

  @IsOptional()
  @Allow()
  options?: any;
}
