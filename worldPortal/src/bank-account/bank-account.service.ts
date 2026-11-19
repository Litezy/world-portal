import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

/**
 * What an applicant needs to make a transfer, and nothing more: the public
 * list answers anyone, so who set an account up, and when, stay on the desk.
 * `id` is only a stable key for the list.
 */
export const PUBLIC_BANK_ACCOUNT_FIELDS = {
  id: true,
  bankName: true,
  accountName: true,
  accountNumber: true,
  swiftCode: true,
  iban: true,
  routingNumber: true,
  currency: true,
  instructions: true,
} satisfies Prisma.BankAccountSelect;

/** The fields `PATCH /bank-accounts/:id` may change. */
const EDITABLE_BANK_ACCOUNT_FIELDS = [
  'bankName',
  'accountName',
  'accountNumber',
  'swiftCode',
  'iban',
  'routingNumber',
  'currency',
  'instructions',
  'isActive',
] as const satisfies ReadonlyArray<keyof UpdateBankAccountDto>;

@Injectable()
export class BankAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bankAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Active accounts as applicants see them (`GET /bank-accounts/public/active`). */
  async findPublicActive() {
    return this.prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: PUBLIC_BANK_ACCOUNT_FIELDS,
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.bankAccount.findUnique({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException(`Bank account with ID "${id}" not found`);
    }
    return account;
  }

  async create(dto: CreateBankAccountDto, createdBy?: string) {
    return this.prisma.bankAccount.create({
      data: {
        bankName: dto.bankName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        swiftCode: dto.swiftCode,
        iban: dto.iban,
        routingNumber: dto.routingNumber,
        currency: dto.currency || 'USD',
        instructions: dto.instructions,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        createdBy: createdBy || 'ADMIN',
      },
    });
  }

  /**
   * Writes only the account's own editable fields, named one by one: never
   * the dto as is, so nothing else that reaches it (`createdBy`, `id`, the
   * timestamps) can be written, whoever calls.
   */
  async update(id: string, dto: UpdateBankAccountDto) {
    await this.findOne(id);
    const data: Prisma.BankAccountUpdateInput = {};
    for (const field of EDITABLE_BANK_ACCOUNT_FIELDS) {
      if (dto[field] !== undefined) {
        (data as Record<string, unknown>)[field] = dto[field];
      }
    }
    return this.prisma.bankAccount.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bankAccount.delete({
      where: { id },
    });
  }
}
