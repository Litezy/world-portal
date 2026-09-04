import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})

export class ProfileModule {}
