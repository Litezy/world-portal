import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { VisaDocumentationController } from '../../visa-documentation/visa-documentation.controller';
import { VisaDocumentationService } from '../../visa-documentation/visa-documentation.service';
import { PassportApplicationController } from '../../passport-application/passport-application.controller';
import { PassportApplicationService } from '../../passport-application/passport-application.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ApplicantService } from '../../applicant/applicant.service';
import { ClerkTokenVerifier } from '../clerk/clerk-token.verifier';

/**
 * The application detail routes are the public "track my application" lookup,
 * so they stay reachable without a login — but a visitor must name the email
 * on the file. Application numbers are only 4 random digits; without the
 * email requirement anyone could walk all of them and read every applicant's
 * passport details. Signed-in desk staff look files up without an email.
 */
const SECRET = 'test-secret-for-detail-lookup';
const jwt = new JwtService({ secret: SECRET });

function forgedToken(payload: object) {
  const part = (v: object) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.made-up-signature`;
}

describe('Application detail lookups (visa and passport)', () => {
  let app: INestApplication<App>;

  const visaService = { findVisaApplicationById: jest.fn() };
  const passportService = { findApplicationById: jest.fn() };
  const profiles: Record<
    string,
    { id: string; email: string; role: UserRole; isActive: boolean }
  > = {
    'staff@example.com': {
      id: 'p-staff',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      isActive: true,
    },
    'gone@example.com': {
      id: 'p-gone',
      email: 'gone@example.com',
      role: UserRole.STAFF,
      isActive: false,
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
      controllers: [VisaDocumentationController, PassportApplicationController],
      providers: [
        { provide: VisaDocumentationService, useValue: visaService },
        { provide: PassportApplicationService, useValue: passportService },
        { provide: ApplicantService, useValue: {} },
        { provide: ClerkTokenVerifier, useValue: { verify: jest.fn() } },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({ ENABLE_MOCK_AUTH: 'false' })[key] ?? fallback,
          },
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
    visaService.findVisaApplicationById
      .mockReset()
      .mockResolvedValue({ id: 'v1' });
    passportService.findApplicationById
      .mockReset()
      .mockResolvedValue({ id: 'p1' });
  });

  describe('GET /visa-documentation/:id', () => {
    it('refuses a visitor who gives no email', async () => {
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001')
        .expect(400);
      expect(visaService.findVisaApplicationById).not.toHaveBeenCalled();
    });

    it('refuses a visitor who gives a blank email', async () => {
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001?email=%20')
        .expect(400);
      expect(visaService.findVisaApplicationById).not.toHaveBeenCalled();
    });

    it('looks the file up for a visitor who names its email', async () => {
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001?email=ada%40example.com')
        .expect(200);
      expect(visaService.findVisaApplicationById).toHaveBeenCalledWith(
        'VISA-2026-1001',
        'ada@example.com',
      );
    });

    it('lets signed-in desk staff look a file up without an email', async () => {
      const token = jwt.sign({ email: 'staff@example.com', sub: 'ext-staff' });
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(visaService.findVisaApplicationById).toHaveBeenCalledWith(
        'VISA-2026-1001',
        undefined,
      );
    });

    it('rejects a forged token instead of treating it as staff', async () => {
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001')
        .set(
          'Authorization',
          `Bearer ${forgedToken({ email: 'staff@example.com' })}`,
        )
        .expect(401);
      expect(visaService.findVisaApplicationById).not.toHaveBeenCalled();
    });

    it('refuses a deactivated staff member', async () => {
      const token = jwt.sign({ email: 'gone@example.com', sub: 'ext-gone' });
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      expect(visaService.findVisaApplicationById).not.toHaveBeenCalled();
    });

    it('refuses a valid token for someone with no staff profile', async () => {
      const token = jwt.sign({ email: 'stranger@example.com', sub: 'ext-x' });
      await request(app.getHttpServer())
        .get('/visa-documentation/VISA-2026-1001')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /passport-application/:id', () => {
    it('refuses a visitor who gives no email', async () => {
      await request(app.getHttpServer())
        .get('/passport-application/PASSPORT-2026-1001')
        .expect(400);
      expect(passportService.findApplicationById).not.toHaveBeenCalled();
    });

    it('looks the file up for a visitor who names its email', async () => {
      await request(app.getHttpServer())
        .get('/passport-application/PASSPORT-2026-1001?email=ada%40example.com')
        .expect(200);
      expect(passportService.findApplicationById).toHaveBeenCalledWith(
        'PASSPORT-2026-1001',
        'ada@example.com',
      );
    });

    it('lets signed-in desk staff look a file up without an email', async () => {
      const token = jwt.sign({ email: 'staff@example.com', sub: 'ext-staff' });
      await request(app.getHttpServer())
        .get('/passport-application/PASSPORT-2026-1001')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('rejects a forged token instead of treating it as staff', async () => {
      await request(app.getHttpServer())
        .get('/passport-application/PASSPORT-2026-1001')
        .set(
          'Authorization',
          `Bearer ${forgedToken({ email: 'staff@example.com' })}`,
        )
        .expect(401);
    });
  });
});
