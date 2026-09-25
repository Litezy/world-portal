import { Module } from '@nestjs/common';
import { ApplicantModule } from '../applicant/applicant.module';
import { VisaDocumentationModule } from '../visa-documentation/visa-documentation.module';
import { PassportApplicationModule } from '../passport-application/passport-application.module';
import { HireModule } from '../hire/hire.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [
    ApplicantModule,
    VisaDocumentationModule,
    PassportApplicationModule,
    HireModule,
  ],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
