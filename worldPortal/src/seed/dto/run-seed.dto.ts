import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RunSeedDto {
  @ApiProperty({
    description: 'Authorization secret code required to run database seeding',
    example: '<value of SEED_SECRET_CODE>',
  })
  @IsString()
  @IsNotEmpty()
  secretCode: string;
}
