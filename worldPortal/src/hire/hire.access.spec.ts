import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { HireController } from './hire.controller';
import { HireService } from './hire.service';
import { ApplicantService } from '../applicant/applicant.service';
import { ClerkTokenVerifier } from '../auth/clerk/clerk-token.verifier';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Who may call each /hire route.
 *
 * - The professional directory reads have no signed-out caller: the public
 *   /hire page is served by the website's server (through the agency list), so
 *   they answer that server's SERVICE_AUTH_KEY or a desk token, like the other
 *   routes the website calls on a visitor's behalf.
 * - Verifying a professional, and the admin list that includes unverified
 *   ones, are desk decisions: a desk token only, never the service key.
 * - Booking stays the signed-in WorldStreet applicant's: neither the service
 *   key nor a desk token stands in for a WorldStreet session.
 */
const SECRET = 'test-secret-for-hire-access';
const SERVICE_KEY = 'service-key-for-hire-tests-0123456789ab';
const CLERK_SESSION = 'clerk-session-token';
const jwt = new JwtService({ secret: SECRET });

function forgedToken(payload: object) {
  const part = (v: object) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.made-up`;
}

const token = (email: string) => jwt.sign({ email, sub: `ext-${email}` });

type Method = 'get' | 'post' | 'patch';
type Route = {
  name: string;
  method: Method;
  path: string;
  body?: object;
  handler: keyof typeof hireService;
  ok: number;
};

const hireService = {
  findProfessionals: jest.fn(),
  findAllProfessionalsAdmin: jest.fn(),
  getProfessionalById: jest.fn(),
  toggleVerification: jest.fn(),
  createBooking: jest.fn(),
};

const directoryRoutes: Route[] = [
  {
    name: 'GET /hire/professionals',
    method: 'get',
    path: '/hire/professionals',
    handler: 'findProfessionals',
    ok: 200,
  },
  {
    name: 'GET /hire/professionals/:id',
    method: 'get',
    path: '/hire/professionals/pro-1',
    handler: 'getProfessionalById',
    ok: 200,
  },
];

const deskDecisionRoutes: Route[] = [
  {
    name: 'GET /hire/professionals/admin',
    method: 'get',
    path: '/hire/professionals/admin',
    handler: 'findAllProfessionalsAdmin',
    ok: 200,
  },
  {
    name: 'PATCH /hire/professionals/:id/verify',
    method: 'patch',
    path: '/hire/professionals/pro-1/verify',
    body: { isVerified: true },
    handler: 'toggleVerification',
    ok: 200,
  },
];

describe('/hire access', () => {
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
    'gone@example.com': {
      id: 'p-g',
      email: 'gone@example.com',
      role: UserRole.MANAGER,
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
  const clerk = {
    verify: jest.fn((sessionToken: string) =>
      sessionToken === CLERK_SESSION
        ? Promise.resolve({ clerkUserId: 'user_1' })
        : Promise.reject(new Error('not a WorldStreet session')),
    ),
  };
  const applicants = {
    requireActiveApplicant: jest.fn().mockResolvedValue({
      clerkUserId: 'user_1',
      email: 'traveller@example.com',
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HireController],
      providers: [
        { provide: HireService, useValue: hireService },
        { provide: ApplicantService, useValue: applicants },
        { provide: ClerkTokenVerifier, useValue: clerk },
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({
                ENABLE_MOCK_AUTH: 'false',
                SERVICE_AUTH_KEY: SERVICE_KEY,
              })[key] ?? fallback,
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
    for (const fn of Object.values(hireService)) {
      fn.mockReset().mockResolvedValue({ ok: true });
    }
  });

  function call(route: Route) {
    const req = request(app.getHttpServer())[route.method](route.path);
    return route.body ? req.send(route.body) : req;
  }

  describe.each(directoryRoutes)('$name (directory read)', (route) => {
    it('refuses a caller with no credentials', async () => {
      await call(route).expect(401);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });

    it("lets the website's server in with the service key", async () => {
      await call(route).set('x-service-key', SERVICE_KEY).expect(route.ok);
      expect(hireService[route.handler]).toHaveBeenCalled();
    });

    it('refuses a wrong service key', async () => {
      await call(route)
        .set('x-service-key', 'wrong-key-wrong-key-wrong-key-wrong-key')
        .expect(401);
    });

    it('lets desk staff in, but not a partner', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('staff@example.com')}`)
        .expect(route.ok);
      await call(route)
        .set('Authorization', `Bearer ${token('partner@example.com')}`)
        .expect(403);
    });

    it('refuses a forged token', async () => {
      await call(route)
        .set(
          'Authorization',
          `Bearer ${forgedToken({ email: 'manager@example.com' })}`,
        )
        .expect(401);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });
  });

  describe.each(deskDecisionRoutes)('$name (desk decision)', (route) => {
    it('refuses a caller with no credentials', async () => {
      await call(route).expect(401);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses the service key: it is not a desk credential', async () => {
      await call(route).set('x-service-key', SERVICE_KEY).expect(401);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });

    it('lets desk staff and managers in', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('staff@example.com')}`)
        .expect(route.ok);
      await call(route)
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .expect(route.ok);
      expect(hireService[route.handler]).toHaveBeenCalledTimes(2);
    });

    it('refuses a partner token', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('partner@example.com')}`)
        .expect(403);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses a deactivated desk member', async () => {
      await call(route)
        .set('Authorization', `Bearer ${token('gone@example.com')}`)
        .expect(403);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });

    it('refuses a forged token', async () => {
      await call(route)
        .set(
          'Authorization',
          `Bearer ${forgedToken({ email: 'manager@example.com' })}`,
        )
        .expect(401);
      expect(hireService[route.handler]).not.toHaveBeenCalled();
    });
  });

  describe('POST /hire/bookings (signed-in applicant)', () => {
    const booking = {
      professionalId: 'pro-1',
      destinationCity: 'Lisbon',
      startsAt: '2026-12-01T09:00:00.000Z',
      endsAt: '2026-12-01T17:00:00.000Z',
      totalAmount: 100,
    };
    const post = () =>
      request(app.getHttpServer()).post('/hire/bookings').send(booking);

    it('refuses a caller with no session', async () => {
      await post().expect(401);
      expect(hireService.createBooking).not.toHaveBeenCalled();
    });

    it('does not take the service key or a desk token for a WorldStreet session', async () => {
      await post().set('x-service-key', SERVICE_KEY).expect(401);
      await post()
        .set('Authorization', `Bearer ${token('manager@example.com')}`)
        .expect(401);
      expect(hireService.createBooking).not.toHaveBeenCalled();
    });

    it('books for a signed-in applicant', async () => {
      await post().set('Authorization', `Bearer ${CLERK_SESSION}`).expect(201);
      expect(hireService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({ professionalId: 'pro-1' }),
        { clerkUserId: 'user_1', email: 'traveller@example.com' },
      );
    });
  });
});
