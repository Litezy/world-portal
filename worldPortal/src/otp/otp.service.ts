import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SendGridService } from '../mail/sendgrid.service';
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

  constructor(private readonly sendGridService: SendGridService) {}

  async sendOtp(dto: SendOtpDto) {
    const emailKey = dto.email.trim().toLowerCase();
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    this.otpStore.set(emailKey, { code, expiresAt });
    this.logger.log(`[OTP GENERATED] Email: ${emailKey} | Code: ${code} | Expires: ${expiresAt.toISOString()}`);

    await this.sendGridService.sendOtpEmail(emailKey, code);

    return {
      success: true,
      message: 'Verification OTP sent to your email address.',
      expiresIn: '10m',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const emailKey = dto.email.trim().toLowerCase();
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

    if (entry.code !== dto.code.trim()) {
      this.logger.warn(`[OTP VERIFY FAILED] Invalid code provided for ${emailKey}`);
      throw new BadRequestException('Invalid verification code.');
    }

    // OTP successfully verified - delete to prevent reuse
    this.otpStore.delete(emailKey);
    // Mark email as verified for 30 minutes
    this.verifiedStore.set(emailKey, new Date(Date.now() + 30 * 60 * 1000));
    this.logger.log(`[OTP VERIFIED SUCCESS] Email: ${emailKey}`);

    return {
      success: true,
      verified: true,
      email: emailKey,
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
