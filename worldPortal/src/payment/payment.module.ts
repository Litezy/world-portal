import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VisaDocumentationModule } from '../visa-documentation/visa-documentation.module';

@Module({
  imports: [PrismaModule, forwardRef(() => VisaDocumentationModule)],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
