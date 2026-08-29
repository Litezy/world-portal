import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VisaMapQueryDto {
  @ApiProperty({
    description: 'ISO alpha-2 or alpha-3 code of the passport country',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  passport: string;
}

export class VisaMapResponseDto {
  @ApiProperty({
    description:
      'Global map breakdown of visa requirements for target passport',
  })
  data: Record<string, unknown>;

  @ApiProperty({ description: 'Response metadata', required: false })
  meta?: Record<string, unknown>;
}
