import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExternalAuthGuard } from '../auth/guards/external-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Bank Account Management')
@Controller('bank-accounts')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Get('public/active')
  @ApiOperation({
    summary: 'List active bank accounts for applicant wire transfers',
    description: 'Public endpoint to retrieve active bank accounts for payments.',
  })
  @ApiResponse({ status: 200, description: 'List of active bank accounts' })
  findPublicActive() {
    return this.bankAccountService.findActive();
  }

  @Get()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PARTNER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all bank accounts (Admin)',
    description: 'Retrieves all configured bank accounts for administration.',
  })
  @ApiResponse({ status: 200, description: 'List of all bank accounts' })
  findAll() {
    return this.bankAccountService.findAll();
  }

  @Post()
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new bank account',
    description: 'Creates a new bank account profile for collecting payments.',
  })
  @ApiResponse({ status: 201, description: 'Bank account created successfully' })
  create(
    @Body() dto: CreateBankAccountDto,
    @CurrentUser('email') email: string,
  ) {
    return this.bankAccountService.create(dto, email);
  }

  @Patch(':id')
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.PARTNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update bank account',
    description: 'Updates bank account details or toggles active status.',
  })
  @ApiResponse({ status: 200, description: 'Bank account updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.bankAccountService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ExternalAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete bank account',
    description: 'Removes a bank account from the system.',
  })
  @ApiResponse({ status: 200, description: 'Bank account deleted successfully' })
  remove(@Param('id') id: string) {
    return this.bankAccountService.remove(id);
  }
}
