import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SendGridService } from '../mail/sendgrid.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { randomInt } from 'crypto';

interface OtpEntry {
  code: string;
  expiresAt: Date;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpEntry>();
  private readonly verifiedStore = new Map<string, Date>();

  constructor(
    private readonly sendGridService: SendGridService,
    private readonly prisma: PrismaService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const emailKey = dto.email.trim().toLowerCase();
    const isDevBypassEnabled = process.env.ENABLE_OTP_DEV_BYPASS === 'true';
    const bypassCode = process.env.OTP_DEV_BYPASS || '000000';
    const code = isDevBypassEnabled ? bypassCode : randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const entry = { code, expiresAt };
    this.otpStore.set(emailKey, entry);

    if (isDevBypassEnabled) {
      this.logger.log(
        `[OTP DEV BYPASS] Dev bypass enabled. Skipping SendGrid email for ${emailKey}. Dev OTP: ${code}`,
      );
      return {
        success: true,
        message: 'Verification OTP sent to your email address.',
        expiresIn: '10m',
      };
    }

    try {
      const sent = await this.sendGridService.sendOtpEmail(emailKey, code);
      if (!sent) throw new Error('OTP delivery was not accepted');
    } catch {
      // A failed older request must not delete a newer code for this email.
      if (this.otpStore.get(emailKey) === entry) {
        this.otpStore.delete(emailKey);
      }
      this.logger.warn('OTP email delivery failed');
      throw new ServiceUnavailableException(
        'Could not send the verification code. Please try again.',
      );
    }

    return {
      success: true,
      message: 'Verification OTP sent to your email address.',
      expiresIn: '10m',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const emailKey = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const isDevBypassEnabled = process.env.ENABLE_OTP_DEV_BYPASS !== 'false';
    const bypassCode = process.env.OTP_DEV_BYPASS || '000000';

    let isCodeValid = false;

    if (isDevBypassEnabled && code === bypassCode) {
      this.logger.log(`[OTP VERIFY BYPASS] Dev bypass code (${bypassCode}) used for ${emailKey}`);
      isCodeValid = true;
    } else {
      const entry = this.otpStore.get(emailKey);

      if (!entry) {
        this.logger.warn(`[OTP VERIFY FAILED] No active OTP found for ${emailKey}`);
        throw new BadRequestException('Verification code has expired or is invalid.');
      }

      if (new Date() > entry.expiresAt) {
        this.otpStore.delete(emailKey);
        this.logger.warn(`[OTP VERIFY FAILED] OTP expired for ${emailKey}`);
        throw new BadRequestException('Verification code has expired. Please request a new one.');
      }

      if (entry.code !== code) {
        this.logger.warn(`[OTP VERIFY FAILED] Invalid code provided for ${emailKey}`);
        throw new BadRequestException('Invalid verification code.');
      }

      isCodeValid = true;
    }

    if (!isCodeValid) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Check account/profile existence in database
    const [profile, agencyUser, agency, visaDoc, passportApp, hireBooking] = await Promise.all([
      this.prisma.profile.findUnique({ where: { email: emailKey } }).catch(() => null),
      this.prisma.agencyUser.findUnique({ where: { email: emailKey } }).catch(() => null),
      this.prisma.agency.findFirst({ where: { email: emailKey } }).catch(() => null),
      this.prisma.visaDocumentation.findFirst({ where: { email: emailKey } }).catch(() => null),
      this.prisma.passportApplication.findFirst({ where: { email: emailKey } }).catch(() => null),
      this.prisma.hireBooking.findFirst({ where: { travellerEmail: emailKey } }).catch(() => null),
    ]);

    const hasAccount = Boolean(profile || agencyUser || agency || visaDoc || passportApp || hireBooking);

    // if (!hasAccount) {
    //   this.logger.warn(`[OTP VERIFY FAILED] No registered account found for ${emailKey}`);
    //   throw new BadRequestException('Invalid account: No registered user or profile matches this email address.');
    // }

    // OTP successfully verified - delete to prevent reuse
    this.otpStore.delete(emailKey);
    // Mark email as verified for 30 minutes
    this.verifiedStore.set(emailKey, new Date(Date.now() + 30 * 60 * 1000));
    this.logger.log(`[OTP VERIFIED SUCCESS] Email: ${emailKey}`);

    return {
      success: true,
      verified: true,
      email: emailKey,
      profileId: profile?.id || null,
      message: 'Email verified successfully.',
    };
  }

  isEmailVerified(email: string): boolean {
    const emailKey = email.trim().toLowerCase();
    const expiresAt = this.verifiedStore.get(emailKey);
    if (!expiresAt) return false;
    if (new Date() > expiresAt) {
      this.verifiedStore.delete(emailKey);
      return false;
    }
    return true;
  }
}
