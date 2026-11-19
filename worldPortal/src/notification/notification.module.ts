import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MeNotificationController } from './me-notification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController, MeNotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
