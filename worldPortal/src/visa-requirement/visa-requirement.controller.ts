import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VisaRequirementService } from './visa-requirement.service';
import { PassportDto } from './dto/passport.dto';
import { DestinationDto } from './dto/destination.dto';
import { VisaCheckQueryDto, VisaCheckDataDto } from './dto/visa-check.dto';
import { VisaMapQueryDto } from './dto/visa-map.dto';

@ApiTags('Visa Requirement')
@Controller('visa-requirement')
export class VisaRequirementController {
  constructor(
    private readonly visaRequirementService: VisaRequirementService,
  ) {}

  @Get('passports')
  @ApiOperation({
    summary: 'Retrieve global passport list',
    description:
      'Fetches the comprehensive list of passport issuing countries with ISO codes and country names.',
  })
  @ApiResponse({
    status: 200,
    description: 'Passports list retrieved successfully',
    type: [PassportDto],
  })
  @ApiResponse({ status: 502, description: 'External RapidAPI service error' })
  async getPassports(): Promise<PassportDto[]> {
    const result = await this.visaRequirementService.getPassports();
    return result.data;
  }

  @Get('destinations')
  @ApiOperation({
    summary: 'Retrieve global destination list',
    description:
      'Fetches the comprehensive list of destination countries with ISO codes and country names.',
  })
  @ApiResponse({
    status: 200,
    description: 'Destinations list retrieved successfully',
    type: [DestinationDto],
  })
  @ApiResponse({ status: 502, description: 'External RapidAPI service error' })
  async getDestinations(): Promise<DestinationDto[]> {
    const result = await this.visaRequirementService.getDestinations();
    return result.data;
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check visa policy requirements',
    description:
      'Queries real-time visa policy requirements between a passport and destination country.',
  })
  @ApiResponse({
    status: 200,
    description: 'Visa policy requirement retrieved successfully',
    type: VisaCheckDataDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 502, description: 'External RapidAPI service error' })
  async checkVisa(
    @Body() query: VisaCheckQueryDto,
  ): Promise<VisaCheckDataDto> {
    const result = await this.visaRequirementService.checkVisa(query);
    return result.data;
  }

  @Post('map')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve passport global visa map overview',
    description:
      'Retrieves grouped visa requirement map categories for a specific passport.',
  })
  @ApiResponse({
    status: 200,
    description: 'Global visa map retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 502, description: 'External RapidAPI service error' })
  async getVisaMap(
    @Body() query: VisaMapQueryDto,
  ): Promise<Record<string, unknown>> {
    const result = await this.visaRequirementService.getVisaMap(query);
    return result.data;
  }
}
