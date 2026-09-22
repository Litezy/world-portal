import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VisaDocumentationModule } from '../visa-documentation/visa-documentation.module';
import { PassportApplicationModule } from '../passport-application/passport-application.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => VisaDocumentationModule),
    forwardRef(() => PassportApplicationModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
