import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { VisaRequirementModule } from './visa-requirement/visa-requirement.module';
import { VisaDocumentationModule } from './visa-documentation/visa-documentation.module';
import { PaymentModule } from './payment/payment.module';
import { PassportApplicationModule } from './passport-application/passport-application.module';
import { BankAccountModule } from './bank-account/bank-account.module';
import { OtpModule } from './otp/otp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    UploadModule,
    VisaRequirementModule,
    VisaDocumentationModule,
    PaymentModule,
    PassportApplicationModule,
    BankAccountModule,
    OtpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
