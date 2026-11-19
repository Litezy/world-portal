import {
  Controller,
  Get,
  INestApplication,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../decorators/roles.decorator';
import { ServiceOrDeskGuard, RequestWithCaller } from './service-or-desk.guard';

/**
 * Routes the website's own server calls on a visitor's behalf (the agency
 * portal, the admin console) accept exactly two callers: that server, proving
 * itself with SERVICE_AUTH_KEY in `x-service-key`, or a signed-in desk member
 * holding one of the route's roles. Anyone else on the internet gets a 401.
 */
const SECRET = 'test-secret-for-service-or-desk';
const SERVICE_KEY = 'service-key-for-tests-0123456789abcdef';
const jwt = new JwtService({ secret: SECRET });

function forgedToken(payload: object) {
  const part = (v: object) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.made-up`;
}

@Controller('probe')
@UseGuards(ServiceOrDeskGuard)
class ProbeController {
  @Get('desk')
  desk(@Req() req: RequestWithCaller) {
    return {
      service: req.serviceCaller === true,
      role: req.profile?.role ?? null,
    };
  }

  @Get('managers')
  @Roles(UserRole.MANAGER)
  managers() {
    return { ok: true };
  }
}

describe('ServiceOrDeskGuard', () => {
  let app: INestApplication<App>;
  let configuredKey: string | undefined = SERVICE_KEY;

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
  const token = (email: string) => jwt.sign({ email, sub: `ext-${email}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) =>
              ({
                ENABLE_MOCK_AUTH: 'false',
                SERVICE_AUTH_KEY: configuredKey,
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

  afterEach(() => {
    configuredKey = SERVICE_KEY;
  });

  it('refuses a caller with no credentials', async () => {
    await request(app.getHttpServer()).get('/probe/desk').expect(401);
  });

  it("lets the website's server in with the service key", async () => {
    const res = await request(app.getHttpServer())
      .get('/probe/desk')
      .set('x-service-key', SERVICE_KEY)
      .expect(200);
    expect(res.body).toEqual({ service: true, role: null });
  });

  it('lets the service key through a manager-only route too', async () => {
    await request(app.getHttpServer())
      .get('/probe/managers')
      .set('x-service-key', SERVICE_KEY)
      .expect(200);
  });

  it('refuses a wrong service key, even alongside a valid token', async () => {
    await request(app.getHttpServer())
      .get('/probe/desk')
      .set('x-service-key', 'wrong-key-wrong-key-wrong-key-wrong-key')
      .set('Authorization', `Bearer ${token('manager@example.com')}`)
      .expect(401);
  });

  it('never accepts a key when the configured one is short', async () => {
    configuredKey = 'short';
    await request(app.getHttpServer())
      .get('/probe/desk')
      .set('x-service-key', 'short')
      .expect(401);
  });

  it('never accepts a key when none is configured', async () => {
    configuredKey = undefined;
    await request(app.getHttpServer())
      .get('/probe/desk')
      .set('x-service-key', '')
      .expect(401);
  });

  it('lets any active desk member in when the route names no roles', async () => {
    const res = await request(app.getHttpServer())
      .get('/probe/desk')
      .set('Authorization', `Bearer ${token('partner@example.com')}`)
      .expect(200);
    expect(res.body).toEqual({ service: false, role: UserRole.PARTNER });
  });

  it("enforces the route's roles for desk members", async () => {
    await request(app.getHttpServer())
      .get('/probe/managers')
      .set('Authorization', `Bearer ${token('staff@example.com')}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/probe/managers')
      .set('Authorization', `Bearer ${token('manager@example.com')}`)
      .expect(200);
  });

  it('rejects a forged token', async () => {
    await request(app.getHttpServer())
      .get('/probe/desk')
      .set(
        'Authorization',
        `Bearer ${forgedToken({ email: 'manager@example.com' })}`,
      )
      .expect(401);
  });

  it('refuses a deactivated desk member', async () => {
    await request(app.getHttpServer())
      .get('/probe/desk')
      .set('Authorization', `Bearer ${token('gone@example.com')}`)
      .expect(403);
  });

  it('refuses a valid token with no desk profile', async () => {
    await request(app.getHttpServer())
      .get('/probe/desk')
      .set('Authorization', `Bearer ${token('stranger@example.com')}`)
      .expect(403);
  });
});
