import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetTestTokenDto {
  @ApiProperty({
    description: 'Email address for the test user profile',
    example: 'manager@loveworld.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Optional external auth ID linked to profile',
    example: 'external-auth-manager-001',
  })
  @IsString()
  @IsOptional()
  externalAuthId?: string;
}
