import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, Min, IsArray } from 'class-validator';

export class CheckoutPackageItemDto {
  @ApiProperty({ description: 'Item type: VISA, PASSPORT, AGENCY, HIRE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Title or description of item' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiProperty({ description: 'Amount for this item' })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateCheckoutPackageDto {
  @ApiProperty({ description: 'Traveller email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'List of package items', type: [CheckoutPackageItemDto] })
  @IsArray()
  items: CheckoutPackageItemDto[];

  @ApiProperty({ description: 'Total checkout amount' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';
}
