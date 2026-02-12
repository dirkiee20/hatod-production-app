import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  label: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}
