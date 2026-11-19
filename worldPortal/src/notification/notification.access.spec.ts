import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkTokenVerifier } from '../auth/clerk/clerk-token.verifier';
import {
  ClerkIdentityService,
  WorldStreetIdentity,
} from '../auth/clerk/clerk-identity.service';
import { NotificationController } from './notification.controller';
import { MeNotificationController } from './me-notification.controller';
import { NotificationService } from './notification.service';

/**
 * In-app notifications are keyed by a recipient id: an applicant's email or an
 * agency id. Both are guessable, so whoever may name a recipient may read and
 * clear that recipient's inbox.
 *
 * - `/notifications/*` answers only the website server (SERVICE_AUTH_KEY),
 *   which names the recipient from the visitor's own session.
 * - `/me/notifications/*` is the signed-in applicant's own inbox, keyed by the
 *   verified email WorldStreet holds for them, never by anything they send.
 * - Marking one notification read checks it belongs to that recipient.
 */
const SERVICE_KEY = 'service-key-for-tests-0123456789abcdef';
const jwt = new JwtService({ secret: 'test-secret-for-notifications' });

type Row = {
  id: string;
  recipientId: string;
  recipientType: string;
  title: string;
  message: string;
  type: string;
  metadata: object;
  isRead: boolean;
  createdAt: Date;
};

describe('Notification routes access', () => {
  let app: INestApplication<App>;
  let rows: Row[] = [];

  const matches = (row: Row, where: Partial<Row>) =>
    Object.entries(where).every(
      ([key, value]) => row[key as keyof Row] === value,
    );

  const prisma = {
    notification: {
      create: jest.fn(({ data }: { data: Omit<Row, 'id' | 'createdAt'> }) => {
        const row = {
          ...data,
          id: `n-${rows.length + 1}`,
          createdAt: new Date(),
        };
        rows.push(row);
        return Promise.resolve(row);
      }),
      findMany: jest.fn(({ where }: { where: Partial<Row> }) =>
        Promise.resolve(rows.filter((row) => matches(row, where))),
      ),
      count: jest.fn(({ where }: { where: Partial<Row> }) =>
        Promise.resolve(rows.filter((row) => matches(row, where)).length),
      ),
      findFirst: jest.fn(({ where }: { where: Partial<Row> }) =>
        Promise.resolve(rows.find((row) => matches(row, where)) ?? null),
      ),
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(rows.find((row) => row.id === where.id) ?? null),
      ),
      update: jest.fn(
        ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
          const row = rows.find((r) => r.id === where.id)!;
          Object.assign(row, data);
          return Promise.resolve(row);
        },
      ),
      updateMany: jest.fn(
        ({ where, data }: { where: Partial<Row>; data: Partial<Row> }) => {
          const hit = rows.filter((row) => matches(row, where));
          hit.forEach((row) => Object.assign(row, data));
          return Promise.resolve({ count: hit.length });
        },
      ),
    },
  };

  const identities: Record<string, WorldStreetIdentity> = {
    user_ada: {
      clerkUserId: 'user_ada',
      email: 'ada@example.com',
      emailVerified: true,
      firstName: 'Ada',
      lastName: null,
    },
    user_unverified: {
      clerkUserId: 'user_unverified',
      email: 'ada@example.com',
      emailVerified: false,
      firstName: null,
      lastName: null,
    },
  };
  const verifier = {
    verify: jest.fn((token: string) =>
      token.startsWith('clerk-')
        ? Promise.resolve({ clerkUserId: token.slice('clerk-'.length) })
        : Promise.reject(new Error('bad token')),
    ),
  };
  const identityService = {
    getIdentity: jest.fn((id: string) =>
      Promise.resolve(identities[id] ?? null),
    ),
  };

  const seed = () => {
    const at = new Date();
    rows = [
      {
        id: 'n-ada',
        recipientId: 'ada@example.com',
        recipientType: 'APPLICANT',
        title: 'Booking Placed',
        message: 'Your booking was placed',
        type: 'BOOKING_REQUESTED',
        metadata: {},
        isRead: false,
        createdAt: at,
      },
      {
        id: 'n-agency',
        recipientId: 'agency-1',
        recipientType: 'AGENCY',
        title: 'New Booking Request',
        message: 'Staff assignment required',
        type: 'BOOKING_REQUESTED',
        metadata: {},
        isRead: false,
        createdAt: at,
      },
    ];
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotificationController, MeNotificationController],
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ClerkTokenVerifier, useValue: verifier },
        { provide: ClerkIdentityService, useValue: identityService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({ ENABLE_MOCK_AUTH: 'false', SERVICE_AUTH_KEY: SERVICE_KEY })[
                key
              ] ?? fallback,
          },
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
    seed();
  });

  const server = () => app.getHttpServer();
  const deskToken = () =>
    jwt.sign({ email: 'manager@example.com', sub: 'ext-manager' });

  describe('/notifications (website server only)', () => {
    it('refuses an anonymous caller on every route', async () => {
      await request(server()).get('/notifications/agency-1').expect(401);
      await request(server())
        .patch('/notifications/n-agency/read')
        .send({ recipientId: 'agency-1' })
        .expect(401);
      await request(server())
        .patch('/notifications/recipient/agency-1/read-all')
        .expect(401);
      await request(server())
        .post('/notifications')
        .send({
          recipientId: 'ada@example.com',
          recipientType: 'APPLICANT',
          title: 'Spoof',
          message: 'Click this link',
          type: 'SYSTEM',
        })
        .expect(401);
      expect(rows.every((row) => !row.isRead)).toBe(true);
      expect(rows).toHaveLength(2);
    });

    it('refuses a desk token: only the website server names recipients', async () => {
      await request(server())
        .get('/notifications/agency-1')
        .set('Authorization', `Bearer ${deskToken()}`)
        .expect(401);
    });

    it('refuses a wrong service key', async () => {
      await request(server())
        .get('/notifications/agency-1')
        .set('x-service-key', 'wrong-key-wrong-key-wrong-key-wrong-key')
        .expect(401);
    });

    it('lists a recipient for the website server', async () => {
      const res = await request(server())
        .get('/notifications/agency-1')
        .set('x-service-key', SERVICE_KEY)
        .expect(200);
      expect(res.body).toMatchObject({
        unreadCount: 1,
        data: [{ id: 'n-agency' }],
      });
    });

    it("will not mark another recipient's notification read (404)", async () => {
      await request(server())
        .patch('/notifications/n-ada/read')
        .set('x-service-key', SERVICE_KEY)
        .send({ recipientId: 'agency-1' })
        .expect(404);
      expect(rows.find((row) => row.id === 'n-ada')!.isRead).toBe(false);
    });

    it("marks the recipient's own notification read", async () => {
      await request(server())
        .patch('/notifications/n-agency/read')
        .set('x-service-key', SERVICE_KEY)
        .send({ recipientId: 'agency-1' })
        .expect(200);
      expect(rows.find((row) => row.id === 'n-agency')!.isRead).toBe(true);
    });

    it('needs the recipient to mark one read', async () => {
      await request(server())
        .patch('/notifications/n-agency/read')
        .set('x-service-key', SERVICE_KEY)
        .send({})
        .expect(400);
      expect(rows.find((row) => row.id === 'n-agency')!.isRead).toBe(false);
    });
  });

  describe('/me/notifications (signed-in applicant)', () => {
    it('refuses without a WorldStreet session', async () => {
      await request(server()).get('/me/notifications').expect(401);
      await request(server()).patch('/me/notifications/read-all').expect(401);
      await request(server()).patch('/me/notifications/n-ada/read').expect(401);
    });

    it("lists the applicant's own inbox by their verified email", async () => {
      const res = await request(server())
        .get('/me/notifications')
        .set('Authorization', 'Bearer clerk-user_ada')
        .expect(200);
      expect(res.body).toMatchObject({
        unreadCount: 1,
        data: [{ id: 'n-ada' }],
      });
    });

    it('shows nothing for an email WorldStreet has not verified', async () => {
      const res = await request(server())
        .get('/me/notifications')
        .set('Authorization', 'Bearer clerk-user_unverified')
        .expect(200);
      expect(res.body).toEqual({ data: [], unreadCount: 0 });
      await request(server())
        .patch('/me/notifications/n-ada/read')
        .set('Authorization', 'Bearer clerk-user_unverified')
        .expect(404);
      expect(rows.find((row) => row.id === 'n-ada')!.isRead).toBe(false);
    });

    it("will not mark an agency's notification read for an applicant (404)", async () => {
      await request(server())
        .patch('/me/notifications/n-agency/read')
        .set('Authorization', 'Bearer clerk-user_ada')
        .expect(404);
      expect(rows.find((row) => row.id === 'n-agency')!.isRead).toBe(false);
    });

    it('marks only their own notifications read', async () => {
      await request(server())
        .patch('/me/notifications/n-ada/read')
        .set('Authorization', 'Bearer clerk-user_ada')
        .expect(200);
      await request(server())
        .patch('/me/notifications/read-all')
        .set('Authorization', 'Bearer clerk-user_ada')
        .expect(200);
      expect(rows.find((row) => row.id === 'n-ada')!.isRead).toBe(true);
      expect(rows.find((row) => row.id === 'n-agency')!.isRead).toBe(false);
    });
  });
});
