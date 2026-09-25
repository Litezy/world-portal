import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import {
  ApplicantPrincipal,
  CurrentApplicant,
} from '../auth/decorators/current-applicant.decorator';
import { ApplicantService } from '../applicant/applicant.service';
import { MeService } from './me.service';

/**
 * The signed-in applicant's own space. Every route requires a WorldStreet
 * session and reads only the caller's records.
 */
@ApiTags('Me (WorldStreet applicant)')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('me')
export class MeController {
  constructor(
    private readonly applicants: ApplicantService,
    private readonly me: MeService,
  ) {}

  @Post('join')
  @ApiOperation({
    summary: 'Join E-Embassy with the current WorldStreet account',
    description:
      'Idempotent. Creates the applicant record on first call and attaches earlier applications submitted with the same verified email.',
  })
  @ApiResponse({ status: 201, description: 'Joined (or already a member).' })
  @ApiResponse({ status: 401, description: 'No valid WorldStreet session.' })
  @ApiResponse({ status: 403, description: 'Applicant is suspended.' })
  join(@CurrentApplicant() principal: ApplicantPrincipal) {
    return this.applicants.join(principal.clerkUserId);
  }

  @Get()
  @ApiOperation({ summary: 'Current applicant membership and identity' })
  getMe(@CurrentApplicant() principal: ApplicantPrincipal) {
    return this.applicants.getMe(principal.clerkUserId);
  }

  @Get('applications')
  @ApiOperation({
    summary: "The caller's visa and passport applications, newest first",
  })
  listApplications(@CurrentApplicant() principal: ApplicantPrincipal) {
    return this.me.listApplications(principal.clerkUserId);
  }

  @Get('applications/:reference')
  @ApiOperation({ summary: 'One of the caller’s applications' })
  @ApiParam({
    name: 'reference',
    description:
      'Application number (VISA-2026-1234 / PASSPORT-2026-1234) or id',
  })
  @ApiResponse({ status: 404, description: 'Not found on this account.' })
  getApplication(
    @CurrentApplicant() principal: ApplicantPrincipal,
    @Param('reference') reference: string,
  ) {
    return this.me.getApplication(principal.clerkUserId, reference);
  }

  @Get('hires')
  @ApiOperation({ summary: "The caller's hire bookings, newest first" })
  listHires(@CurrentApplicant() principal: ApplicantPrincipal) {
    return this.me.listHires(principal.clerkUserId);
  }
}
