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
  sendOtp(@Body() dto: SendOtpDto) {
    return this.otpService.sendOtp(dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify 6-digit Email OTP code',
    description:
      'Validates the 6-digit OTP code against the registered email address.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'OTP code is invalid or has expired.',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto);
  }
}
