import { Module } from '@nestjs/common';
import { PassportApplicationController } from './passport-application.controller';
import { PassportApplicationService } from './passport-application.service';

import { MailModule } from '../mail/mail.module';
import { OtpModule } from '../otp/otp.module';
import { ApplicantModule } from '../applicant/applicant.module';

@Module({
  imports: [MailModule, OtpModule, ApplicantModule],
  controllers: [PassportApplicationController],
  providers: [PassportApplicationService],
  exports: [PassportApplicationService],
})


export class PassportApplicationModule {}
