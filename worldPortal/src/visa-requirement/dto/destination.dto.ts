import { ApiProperty } from '@nestjs/swagger';

export class DestinationDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'JP',
  })
  iso_alpha2: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-3 country code',
    example: 'JPN',
  })
  iso_alpha3: string;

  @ApiProperty({ description: 'Country / territory name', example: 'Japan' })
  name: string;
}

export class DestinationsMetaDto {
  @ApiProperty({ description: 'API version', example: '2.0' })
  version: string;

  @ApiProperty({ description: 'Language code', example: 'en' })
  language: string;

  @ApiProperty({
    description: 'Generation timestamp',
    example: '2025-10-07T12:31:40+00:00',
  })
  generated_at: string;
}

export class DestinationsResponseDto {
  @ApiProperty({
    type: [DestinationDto],
    description: 'List of supported destinations',
  })
  data: DestinationDto[];

  @ApiProperty({ type: DestinationsMetaDto, description: 'Response metadata' })
  meta: DestinationsMetaDto;
}
