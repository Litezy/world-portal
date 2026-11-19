import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Email OTP Verification')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send 6-digit Email Verification OTP code',
    description:
      'Generates and sends a 6-digit OTP to the specified email via SendGrid, valid for 10 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP dispatched successfully.',
  })
  @ApiResponse({
    status: 429,
    description:
      'This email has been sent its hourly share of codes (OTP_SENDS_PER_EMAIL_PER_HOUR, default 5).',
  })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify 6-digit Email OTP code',
    description:
      'Validates the 6-digit OTP code against the email it was sent to (5 wrong tries invalidate it; 10 wrong tries an hour, across codes, lock the email for the hour). On success returns `lookupToken`, a 30-minute proof of that email for the public status lookups (`x-lookup-token`).',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'OTP code is invalid or has expired.',
  })
  @ApiResponse({
    status: 429,
    description:
      'Too many wrong codes for this email this hour, across every code it was sent (OTP_FAILURES_PER_EMAIL_PER_HOUR, default 10). Even the right code is refused until the hour rolls past.',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }
}
