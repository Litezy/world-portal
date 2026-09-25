import { Module } from '@nestjs/common';
import { HireController } from './hire.controller';
import { HireService } from './hire.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ApplicantModule } from '../applicant/applicant.module';

@Module({
  imports: [PrismaModule, NotificationModule, ApplicantModule],
  controllers: [HireController],
  providers: [HireService],
  exports: [HireService],
})
export class HireModule {}
