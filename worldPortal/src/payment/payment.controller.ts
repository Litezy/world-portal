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
import { InitiateRefundDto } from './dto/initiate-refund.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { QueryPaymentTransactionDto } from './dto/query-payment-transaction.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Payment Management')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  @ApiOperation({
    summary: 'Initiate payment transaction for visa application',
    description:
      'Initiates a payment transaction record (FULL or HALF_INSTALLMENT) for visa processing',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment transaction initiated successfully',
  })
  initiateTransaction(
    @Body() dto: InitiatePaymentTransactionDto,
    @CurrentUser('email') userEmail?: string,
  ) {
    return this.paymentService.initiatePaymentTransaction(
      dto,
      userEmail || 'guest-applicant',
    );
  }

  @Post('confirm')
  @ApiOperation({
    summary: 'Confirm payment transaction (Direct Service Injection)',
    description:
      'Confirms payment and immediately invokes VisaDocumentationService directly in code to advance visa application status to UNDER_REVIEW',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed and visa application moved to UNDER_REVIEW',
  })
  confirmTransaction(@Body() dto: ConfirmPaymentTransactionDto) {
    return this.paymentService.confirmPaymentTransaction(dto);
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
}
