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

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
  
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsNumber()
  @IsOptional()
  preparationTime?: number;

  @IsOptional()
  @Allow()
  options?: any;
}
