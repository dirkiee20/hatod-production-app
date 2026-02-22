import { IsNumber } from 'class-validator';

export class QuotePabiliRequestDto {
  @IsNumber()
  serviceFee: number;
}
