import { Module } from '@nestjs/common';
import { PassportApplicationController } from './passport-application.controller';
import { PassportApplicationService } from './passport-application.service';

@Module({
  controllers: [PassportApplicationController],
  providers: [PassportApplicationService],
  exports: [PassportApplicationService],
})
export class PassportApplicationModule {}
