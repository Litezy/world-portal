import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BankAccountService } from './bank-account.service';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { PrismaService } from '../prisma/prisma.service';

describe('BankAccountService', () => {
  let service: BankAccountService;

  const stored = {
    id: 'bank-1',
    bankName: 'Sample Bank',
    accountName: 'World Portal Ltd',
    accountNumber: '0123456789',
    swiftCode: null,
    iban: null,
    routingNumber: null,
    currency: 'USD',
    instructions: null,
    isActive: true,
    createdBy: 'manager@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    bankAccount: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.bankAccount.findUnique.mockResolvedValue(stored);
    prisma.bankAccount.update.mockResolvedValue(stored);
    const moduleRef = await Test.createTestingModule({
      providers: [
        BankAccountService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(BankAccountService);
  });

  describe('update', () => {
    it('writes only the editable account fields, whatever else the dto carries', async () => {
      await service.update('bank-1', {
        accountNumber: '9999999999',
        isActive: false,
        createdBy: 'someone-else@example.com',
        id: 'bank-2',
        createdAt: new Date('2020-01-01'),
      } as UpdateBankAccountDto);

      const [args] = prisma.bankAccount.update.mock.calls[0] as [
        { where: unknown; data: Record<string, unknown> },
      ];
      expect(args.where).toEqual({ id: 'bank-1' });
      expect(args.data).toEqual({
        accountNumber: '9999999999',
        isActive: false,
      });
    });
  });

  describe('findPublicActive', () => {
    it('selects only the transfer details from active accounts', async () => {
      prisma.bankAccount.findMany.mockResolvedValue([]);

      await service.findPublicActive();

      const [args] = prisma.bankAccount.findMany.mock.calls[0] as [
        { where: unknown; select: Record<string, boolean> },
      ];
      expect(args.where).toEqual({ isActive: true });
      expect(Object.keys(args.select).sort()).toEqual(
        [
          'id',
          'bankName',
          'accountName',
          'accountNumber',
          'swiftCode',
          'iban',
          'routingNumber',
          'currency',
          'instructions',
        ].sort(),
      );
    });
  });

  describe('UpdateBankAccountDto', () => {
    const errorsFor = async (body: object) =>
      (
        await validate(plainToInstance(UpdateBankAccountDto, body), {
          whitelist: true,
          forbidNonWhitelisted: true,
        })
      ).map((error) => error.property);

    it.each(['createdBy', 'id', 'createdAt', 'updatedAt'])(
      'does not accept %s',
      async (field) => {
        expect(await errorsFor({ [field]: 'x' })).toContain(field);
      },
    );

    it('accepts a partial edit of the transfer details', async () => {
      expect(
        await errorsFor({ accountNumber: '9999999999', isActive: false }),
      ).toEqual([]);
    });

    it('refuses blanking a required detail', async () => {
      expect(await errorsFor({ accountNumber: '' })).toContain('accountNumber');
    });
  });
});
