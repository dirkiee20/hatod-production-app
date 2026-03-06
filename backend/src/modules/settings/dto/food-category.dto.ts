import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFoodCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFoodCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
