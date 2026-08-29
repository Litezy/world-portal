import { ApiProperty } from '@nestjs/swagger';

export class PassportDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
  })
  iso_alpha2: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-3 country code',
    example: 'USA',
  })
  iso_alpha3: string;

  @ApiProperty({
    description: 'Country / territory name',
    example: 'United States of America',
  })
  name: string;
}

export class PassportsMetaDto {
  @ApiProperty({ description: 'API version', example: '2.0' })
  version: string;

  @ApiProperty({ description: 'Language code', example: 'en' })
  language: string;

  @ApiProperty({
    description: 'Generation timestamp',
    example: '2025-10-07T00:00:00+00:00',
  })
  generated_at: string;
}

export class PassportsResponseDto {
  @ApiProperty({
    type: [PassportDto],
    description: 'List of supported passports',
  })
  data: PassportDto[];

  @ApiProperty({ type: PassportsMetaDto, description: 'Response metadata' })
  meta: PassportsMetaDto;
}
