import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignStaffDto {
  @ApiProperty({
    description: 'Array of staff IDs assigned to this booking',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  assignedStaffIds: string[];
}
