import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InitiatePaymentTransactionDto } from './dto/initiate-payment-transaction.dto';
import { ConfirmPaymentTransactionDto } from './dto/confirm-payment-transaction.dto';
import { ConfirmBankTransferDto } from './dto/confirm-bank-transfer.dto';
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { QueryPaymentTransactionDto } from './dto/query-payment-transaction.dto';
import { QueryRefundDto } from './dto/query-refund.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import {
  ApplicantPrincipal,
  CurrentApplicant,
} from '../auth/decorators/current-applicant.decorator';
import { ApplicantService } from '../applicant/applicant.service';

import { CreateCheckoutPackageDto } from './dto/create-checkout-package.dto';

@ApiTags('Payment Management')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly applicants: ApplicantService,
  ) {}

  // An applicant pays for their own basket: a WorldStreet session is required
  // and the basket is filed under their verified email, not the body's.
  @Post('checkout-package')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary:
      'Initiate package checkout transaction for bundled cart items (signed-in applicant)',
  })
  @ApiResponse({
    status: 201,
    description: 'Package checkout transaction initiated successfully',
  })
  @ApiResponse({ status: 401, description: 'No valid WorldStreet session.' })
  async checkoutPackage(
    @Body() dto: CreateCheckoutPackageDto,
    @CurrentApplicant() principal: ApplicantPrincipal,
  ) {
    const owner = await this.applicants.requireActiveApplicant(
      principal.clerkUserId,
    );
    return this.paymentService.createPackageCheckout(dto, owner);
  }

  // An applicant pays for their own visa: a WorldStreet session is required,
  // and someone else's application is a 404.
  @Post('initiate')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary:
      'Initiate payment transaction for the caller’s own visa application',
    description:
      'Initiates a payment transaction record (FULL or HALF_INSTALLMENT) for visa processing',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment transaction initiated successfully',
  })
  @ApiResponse({ status: 401, description: 'No valid WorldStreet session.' })
  @ApiResponse({
    status: 404,
    description: 'No such application on the caller’s account.',
  })
  async initiateTransaction(
    @Body() dto: InitiatePaymentTransactionDto,
    @CurrentApplicant() principal: ApplicantPrincipal,
  ) {
    const owner = await this.applicants.requireActiveApplicant(
      principal.clerkUserId,
    );
    return this.paymentService.initiatePaymentTransaction(dto, owner);
  }

  // Nothing here checks with a payment provider that money arrived, so this
  // stays a desk action (like bank-transfer/confirm) until a signed provider
  // webhook replaces it. Open, it let anyone mark their own visa as paid.
  @Post('confirm')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Confirm payment transaction (Manager / Staff)',
    description:
      'Confirms an INITIATED payment and credits its visa application (moving it to UNDER_REVIEW) in one transaction. The amount must fit the balance due, as for a bank transfer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed and visa application moved to UNDER_REVIEW',
  })
  @ApiResponse({
    status: 409,
    description:
      'The payment is not INITIATED (already confirmed, refunded or failed), another confirm won the race, or the amount no longer fits the balance due.',
  })
  confirmTransaction(@Body() dto: ConfirmPaymentTransactionDto) {
    return this.paymentService.confirmPaymentTransaction(dto);
  }

  @Post('bank-transfer/confirm')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Manually confirm bank transfer payment (Admin / Manager / Staff)',
    description:
      'Records confirmed bank transfer transaction, updates applicant balance, transitions status to UNDER_REVIEW, and dispatches email receipt',
  })
  @ApiResponse({
    status: 200,
    description:
      'Bank transfer payment confirmed and visa application moved to UNDER_REVIEW',
  })
  confirmBankTransfer(
    @Body() dto: ConfirmBankTransferDto,
    @CurrentUser('email') userEmail?: string,
  ) {
    return this.paymentService.confirmBankTransferPayment(
      dto,
      userEmail || 'admin-manual',
    );
  }

  @Post('refund')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary:
      'Process surcharged refund for a confirmed transaction (Manager Only)',
    description:
      'Calculates surcharged refund rate using system PaymentConfig, deducts surcharge, and issues refund record',
  })
  @ApiResponse({
    status: 201,
    description: 'Surcharged refund processed successfully',
  })
  processRefund(
    @Body() dto: InitiateRefundDto,
    @CurrentUser('email') userEmail?: string,
  ) {
    return this.paymentService.initiateRefund(
      dto,
      userEmail || 'admin-manager',
    );
  }

  @Get('config')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get system payment and refund configuration settings',
  })
  getPaymentConfig() {
    return this.paymentService.getPaymentConfig();
  }

  @Patch('config')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update partner markup & refund surcharge rates (Manager Only)',
  })
  updatePaymentConfig(
    @Body() dto: UpdatePaymentConfigDto,
    @CurrentUser('email') userEmail?: string,
  ) {
    return this.paymentService.updatePaymentConfig(
      dto,
      userEmail || 'admin-manager',
    );
  }

  @Get('transactions')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'List payment transactions with filters (Manager / Staff)',
  })
  findAllTransactions(@Query() query: QueryPaymentTransactionDto) {
    return this.paymentService.findAllTransactions(query);
  }

  @Get('refunds')
  @ApiBearerAuth()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'List processed refunds, newest first (Manager / Staff)',
    description:
      'Paged. Each refund carries its original transaction reference, application number and currency (ADR 0016).',
  })
  @ApiResponse({
    status: 200,
    description: '{ data, meta: { total, page, limit, pages } }',
  })
  findAllRefunds(@Query() query: QueryRefundDto) {
    return this.paymentService.findAllRefunds(query);
  }
}
