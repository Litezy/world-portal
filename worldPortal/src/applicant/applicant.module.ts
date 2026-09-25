import { Module } from '@nestjs/common';
import { ApplicantService } from './applicant.service';

/**
 * Applicant membership. Imported by every module whose writes belong to an
 * applicant (visa, passport, hire) so they share one ownership guard.
 */
@Module({
  providers: [ApplicantService],
  exports: [ApplicantService],
})
export class ApplicantModule {}
