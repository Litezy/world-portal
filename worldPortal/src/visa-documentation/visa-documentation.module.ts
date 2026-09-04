import { Module, forwardRef } from '@nestjs/common';
import { VisaDocumentationService } from './visa-documentation.service';
import { VisaDocumentationController } from './visa-documentation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';
import { MailModule } from '../mail/mail.module';
import { BankAccountModule } from '../bank-account/bank-account.module';

import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    BankAccountModule,
    OtpModule,
    forwardRef(() => PaymentModule),
  ],
  controllers: [VisaDocumentationController],
  providers: [VisaDocumentationService],
  exports: [VisaDocumentationService],
})

export class VisaDocumentationModule {}
