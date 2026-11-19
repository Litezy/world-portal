import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { RunSeedDto } from './dto/run-seed.dto';

@ApiTags('Database Seed')
@Controller('seed')
export class SeedController {
  private readonly logger = new Logger(SeedController.name);

  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger presentation database seed execution',
    description:
      'Populates the database with rich presentation demo data (agencies, staff, professionals, visa/passport applications, bank accounts). Off unless ENABLE_SEED_ENDPOINT=true; requires the code set in SEED_SECRET_CODE (there is no default).',
  })
  @ApiResponse({
    status: 200,
    description: 'Database presentation seed executed successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid seeding secret code.',
  })
  async runSeed(@Body() dto: RunSeedDto) {
    this.logger.log('POST /seed API requested');
    return this.seedService.runSeed(dto);
  }
}
