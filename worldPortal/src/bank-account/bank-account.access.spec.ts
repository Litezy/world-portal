import {
  INestApplication,
  UnprocessableEntityException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The bank accounts are shown to applicants as where to send their money, so
 * changing one is a manager's decision alone: a partner or staff member who
 * could edit an account number could redirect every applicant's payment.
 *
 * The public list answers anyone, so it carries only what a transfer needs,
 * never who set the account up or when.
 */
const jwt = new JwtService({ secret: 'test-secret-for-bank-accounts' });
const token = (email: string) => jwt.sign({ email, sub: `ext-${email}` });

const storedAccount = {
  id: 'bank-1',
  bankName: 'Sample Bank',
  accountName: 'World Portal Ltd',
  accountNumber: '0123456789',
  swiftCode: 'SMPLNGLA',
  iban: 'GB00SMPL00000000000000',
  routingNumber: '000111222',
  currency: 'USD',
  instructions: 'Put your application number in the reference.',
  isActive: true,
  createdBy: 'manager@example.com',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
};

describe('/bank-accounts access', () => {
  let app: INestApplication<App>;

  const profiles: Record<
    string,
    { id: string; email: string; role: UserRole; isActive: boolean }
  > = {
    'manager@example.com': {
      id: 'p-m',
      email: 'manager@example.com',
      role: UserRole.MANAGER,
      isActive: true,
    },
    'staff@example.com': {
      id: 'p-s',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      isActive: true,
    },
    'partner@example.com': {
      id: 'p-p',
      email: 'partner@example.com',
      role: UserRole.PARTNER,
      isActive: true,
    },
  };

  const prisma = {
    profile: {
      findFirst: jest.fn(
        ({ where }: { where: { OR: Array<{ email?: string }> } }) => {
          const email = where.OR.find((c) => c.email)?.email;
          return Promise.resolve((email && profiles[email]) || null);
        },
      ),
    },
    bankAccount: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BankAccountController],
      providers: [
        BankAccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback?: string) => fallback },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // As main.ts sets it up.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: () => new UnprocessableEntityException(),
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Like Prisma: a `select` returns only the fields it names.
    prisma.bankAccount.findMany
      .mockReset()
      .mockImplementation(({ select }: { select?: Record<string, boolean> }) =>
        Promise.resolve([
          select
            ? Object.fromEntries(
                Object.entries(storedAccount).filter(([key]) => select[key]),
              )
            : storedAccount,
        ]),
      );
    prisma.bankAccount.findUnique.mockReset().mockResolvedValue(storedAccount);
    prisma.bankAccount.create.mockReset().mockResolvedValue(storedAccount);
    prisma.bankAccount.update.mockReset().mockResolvedValue(storedAccount);
    prisma.bankAccount.delete.mockReset().mockResolvedValue(storedAccount);
  });

  const server = () => app.getHttpServer();
  const newAccount = {
    bankName: 'Sample Bank',
    accountName: 'World Portal Ltd',
    accountNumber: '0123456789',
  };

  describe('POST /bank-accounts', () => {
    it('refuses a caller with no token', async () => {
      await request(server())
        .post('/bank-accounts')
        .send(newAccount)
        .expect(401);
      expect(prisma.bankAccount.create).not.toHaveBeenCalled();
    });

    it.each(['partner@example.com', 'staff@example.com'])(
      'refuses %s: only a manager may add where applicants pay',
      async (email) => {
        await request(server())
          .post('/bank-accounts')
          .set('Authorization', `Bearer ${token(email)}`)
          .send(newAccount)
          .expect(403);
        expect(prisma.bankAccount.create).not.toHaveBeenCalled();
      },
    );

    it('lets a manager add one', async () => {
      await request(server())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .send(newAccount)
        .expect(201);
      expect(prisma.bankAccount.create).toHaveBeenCalled();
    });
  });

  describe('PATCH /bank-accounts/:id', () => {
    it.each(['partner@example.com', 'staff@example.com'])(
      'refuses %s: only a manager may change an account number',
      async (email) => {
        await request(server())
          .patch('/bank-accounts/bank-1')
          .set('Authorization', `Bearer ${token(email)}`)
          .send({ accountNumber: '9999999999' })
          .expect(403);
        expect(prisma.bankAccount.update).not.toHaveBeenCalled();
      },
    );

    it('lets a manager change one', async () => {
      await request(server())
        .patch('/bank-accounts/bank-1')
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .send({ accountNumber: '9999999999' })
        .expect(200);
      expect(prisma.bankAccount.update).toHaveBeenCalled();
    });

    it.each([
      ['createdBy', 'someone-else@example.com'],
      ['id', 'bank-2'],
      ['createdAt', '2020-01-01T00:00:00Z'],
    ])('refuses a body that sets %s', async (field, value) => {
      await request(server())
        .patch('/bank-accounts/bank-1')
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .send({ [field]: value })
        .expect(422);
      expect(prisma.bankAccount.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /bank-accounts/:id', () => {
    it.each(['partner@example.com', 'staff@example.com'])(
      'refuses %s',
      async (email) => {
        await request(server())
          .delete('/bank-accounts/bank-1')
          .set('Authorization', `Bearer ${token(email)}`)
          .expect(403);
        expect(prisma.bankAccount.delete).not.toHaveBeenCalled();
      },
    );

    it('lets a manager remove one', async () => {
      await request(server())
        .delete('/bank-accounts/bank-1')
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .expect(200);
      expect(prisma.bankAccount.delete).toHaveBeenCalled();
    });
  });

  describe('GET /bank-accounts/public/active', () => {
    it('answers anyone with only what a transfer needs', async () => {
      const res = await request(server())
        .get('/bank-accounts/public/active')
        .expect(200);

      expect(res.body).toEqual([
        {
          id: 'bank-1',
          bankName: 'Sample Bank',
          accountName: 'World Portal Ltd',
          accountNumber: '0123456789',
          swiftCode: 'SMPLNGLA',
          iban: 'GB00SMPL00000000000000',
          routingNumber: '000111222',
          currency: 'USD',
          instructions: 'Put your application number in the reference.',
        },
      ]);
      expect(JSON.stringify(res.body)).not.toContain('manager@example.com');
    });

    it('lists only active accounts', async () => {
      await request(server()).get('/bank-accounts/public/active').expect(200);
      const [args] = prisma.bankAccount.findMany.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(args.where).toEqual({ isActive: true });
    });
  });
});
