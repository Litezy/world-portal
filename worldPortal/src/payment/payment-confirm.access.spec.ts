import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * POST /payments/confirm marks a transaction CONFIRMED and moves the visa to
 * review. It never asks a payment provider whether money arrived, and
 * /payments/initiate hands the reference straight back to the caller — so if
 * confirm is open, anyone can "pay" for a visa without paying. Until a real
 * provider webhook exists, only desk staff may confirm, as with bank transfers.
 */
const jwt = new JwtService({ secret: 'test-secret-for-payment-confirm' });

describe('POST /payments/confirm access', () => {
  let app: INestApplication<App>;

  const paymentService = { confirmPaymentTransaction: jest.fn() };
  const profiles: Record<
    string,
    { id: string; email: string; role: UserRole; isActive: boolean }
  > = {
    'staff@example.com': {
      id: 'p1',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      isActive: true,
    },
    'partner@example.com': {
      id: 'p2',
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
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: paymentService },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback?: string) => fallback },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    paymentService.confirmPaymentTransaction.mockReset().mockResolvedValue({
      transactionRef: 'TXN-PAY-123456',
      status: 'CONFIRMED',
    });
  });

  it('refuses a caller with no token', async () => {
    await request(app.getHttpServer())
      .post('/payments/confirm')
      .send({ transactionRef: 'TXN-PAY-123456' })
      .expect(401);
    expect(paymentService.confirmPaymentTransaction).not.toHaveBeenCalled();
  });

  it('refuses a partner', async () => {
    const token = jwt.sign({ email: 'partner@example.com', sub: 'ext-p2' });
    await request(app.getHttpServer())
      .post('/payments/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionRef: 'TXN-PAY-123456' })
      .expect(403);
    expect(paymentService.confirmPaymentTransaction).not.toHaveBeenCalled();
  });

  it('lets desk staff confirm', async () => {
    const token = jwt.sign({ email: 'staff@example.com', sub: 'ext-p1' });
    await request(app.getHttpServer())
      .post('/payments/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ transactionRef: 'TXN-PAY-123456' })
      .expect(201);
    expect(paymentService.confirmPaymentTransaction).toHaveBeenCalledWith({
      transactionRef: 'TXN-PAY-123456',
    });
  });
});
