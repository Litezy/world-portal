import { Module } from '@nestjs/common';
import { VisaRequirementController } from './visa-requirement.controller';
import { VisaRequirementService } from './visa-requirement.service';

@Module({
  controllers: [VisaRequirementController],
  providers: [VisaRequirementService],
  exports: [VisaRequirementService],
})
export class VisaRequirementModule {}
