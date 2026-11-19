import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { PaymentOption, Prisma } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkTokenVerifier } from '../auth/clerk/clerk-token.verifier';
import { ApplicantService } from '../applicant/applicant.service';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import { PassportApplicationService } from '../passport-application/passport-application.service';
import { SendGridService } from '../mail/sendgrid.service';

/**
 * POST /payments/initiate and /payments/checkout-package open a payment
 * transaction. They are an applicant's actions: paying for their own visa,
 * paying for their own basket. Open, anyone could open transactions against
 * any application (and read its price back), or file a basket under anyone's
 * email. Now both need a WorldStreet session, the visa must be the caller's
 * own (a 404 otherwise, as if it did not exist), and the payer is recorded as
 * the caller's verified email, never an email or profile from the body.
 */
const jwt = new JwtService({ secret: 'test-secret-for-payment-initiate' });

describe('Applicant payment routes access', () => {
  let app: INestApplication<App>;

  const visas: Record<string, Record<string, unknown>> = {
    'visa-ada': {
      id: 'visa-ada',
      applicationNo: 'VISA-2026-1111',
      clerkUserId: 'user_ada',
      profileId: null,
      email: 'ada@example.com',
      totalAmount: new Prisma.Decimal(1000),
      amountPaid: new Prisma.Decimal(0),
      allowInstallment: true,
    },
    'visa-bob': {
      id: 'visa-bob',
      applicationNo: 'VISA-2026-2222',
      clerkUserId: 'user_bob',
      profileId: null,
      email: 'bob@example.com',
      totalAmount: new Prisma.Decimal(800),
      amountPaid: new Prisma.Decimal(0),
      allowInstallment: false,
    },
  };

  const visaDocService = {
    findVisaApplicationById: jest.fn((idOrNo: string) => {
      const visa = Object.values(visas).find(
        (v) => v.id === idOrNo || v.applicationNo === idOrNo,
      );
      return visa
        ? Promise.resolve(visa)
        : Promise.reject(new NotFoundException('not found'));
    }),
  };
  const prisma = {
    paymentTransaction: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...data, id: 'txn-1' }),
      ),
    },
    profile: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const verifier = {
    verify: jest.fn((token: string) =>
      token.startsWith('clerk-')
        ? Promise.resolve({ clerkUserId: token.slice('clerk-'.length) })
        : Promise.reject(new Error('bad token')),
    ),
  };
  const applicants = {
    requireActiveApplicant: jest.fn((clerkUserId: string) =>
      Promise.resolve({
        clerkUserId,
        email: `${clerkUserId.replace('user_', '')}@example.com`,
      }),
    ),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: VisaDocumentationService, useValue: visaDocService },
        { provide: PassportApplicationService, useValue: {} },
        { provide: SendGridService, useValue: {} },
        { provide: ClerkTokenVerifier, useValue: verifier },
        { provide: ApplicantService, useValue: applicants },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: (_key: string, fallback?: string) => fallback },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.paymentTransaction.create.mockClear();
  });

  const server = () => app.getHttpServer();
  const createdWith = () =>
    (
      prisma.paymentTransaction.create.mock.calls[0] as [
        { data: Record<string, unknown> },
      ]
    )[0].data;

  describe('POST /payments/initiate', () => {
    it('refuses a caller with no WorldStreet session', async () => {
      await request(server())
        .post('/payments/initiate')
        .send({ visaDocumentationId: 'visa-ada', paymentOption: 'FULL' })
        .expect(401);
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('refuses a desk token: it is not an applicant session', async () => {
      const desk = jwt.sign({ email: 'staff@example.com', sub: 'ext-staff' });
      await request(server())
        .post('/payments/initiate')
        .set('Authorization', `Bearer ${desk}`)
        .send({ visaDocumentationId: 'visa-ada', paymentOption: 'FULL' })
        .expect(401);
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it("answers 404 for someone else's application, by id or number", async () => {
      for (const ref of ['visa-bob', 'VISA-2026-2222']) {
        const res = await request(server())
          .post('/payments/initiate')
          .set('Authorization', 'Bearer clerk-user_ada')
          .send({ visaDocumentationId: ref, paymentOption: 'FULL' })
          .expect(404);
        expect(JSON.stringify(res.body)).not.toContain('800');
      }
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('opens a transaction on their own application, as their verified email', async () => {
      const res = await request(server())
        .post('/payments/initiate')
        .set('Authorization', 'Bearer clerk-user_ada')
        .send({
          visaDocumentationId: 'visa-ada',
          paymentOption: PaymentOption.FULL,
          profileId: 'someone-elses-profile',
        })
        .expect(201);

      expect(
        typeof (res.body as { transactionRef?: unknown }).transactionRef,
      ).toBe('string');
      expect(createdWith()).toMatchObject({
        visaDocumentationId: 'visa-ada',
        initiatedBy: 'ada@example.com',
        profileId: null,
      });
    });
  });

  describe('POST /payments/checkout-package', () => {
    const basket = {
      email: 'victim@example.com',
      items: [{ type: 'HIRE', title: 'Interpreter', amount: 120 }],
      totalAmount: 120,
    };

    it('refuses a caller with no WorldStreet session', async () => {
      await request(server())
        .post('/payments/checkout-package')
        .send(basket)
        .expect(401);
      expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it("files the basket under the caller's verified email, not the body's", async () => {
      await request(server())
        .post('/payments/checkout-package')
        .set('Authorization', 'Bearer clerk-user_ada')
        .send(basket)
        .expect(201);
      expect(createdWith()).toMatchObject({ initiatedBy: 'ada@example.com' });
    });

    it('no longer needs an email in the body', async () => {
      await request(server())
        .post('/payments/checkout-package')
        .set('Authorization', 'Bearer clerk-user_ada')
        .send({ items: basket.items, totalAmount: basket.totalAmount })
        .expect(201);
      expect(createdWith()).toMatchObject({ initiatedBy: 'ada@example.com' });
    });
  });
});
