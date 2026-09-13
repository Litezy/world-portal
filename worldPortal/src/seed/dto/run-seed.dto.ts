import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RunSeedDto {
  @ApiProperty({
    description: 'Authorization secret code required to run database seeding',
    example: 'WORLD_PORTAL_SEED_2026_SECURE',
  })
  @IsString()
  @IsNotEmpty()
  secretCode: string;
}
