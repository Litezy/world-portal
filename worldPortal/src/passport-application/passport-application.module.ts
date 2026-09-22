import { Module } from '@nestjs/common';
import { PassportApplicationController } from './passport-application.controller';
import { PassportApplicationService } from './passport-application.service';

import { MailModule } from '../mail/mail.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [MailModule, OtpModule],
  controllers: [PassportApplicationController],
  providers: [PassportApplicationService],
  exports: [PassportApplicationService],
})


export class PassportApplicationModule {}
