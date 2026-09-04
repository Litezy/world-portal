import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

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

  async update(id: string, dto: UpdateBankAccountDto) {
    await this.findOne(id);
    return this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bankAccount.delete({
      where: { id },
    });
  }
}
