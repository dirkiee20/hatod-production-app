import { IsArray, IsNumber, IsString } from 'class-validator';

export class CreatePabiliRequestDto {
  @IsArray()
  @IsString({ each: true })
  items: string[];

  @IsNumber()
  estimatedItemCost: number;
}
