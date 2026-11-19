import { Controller, Get, Global, Module, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ClerkTokenVerifier } from '../../auth/clerk/clerk-token.verifier';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { RateLimitModule } from './rate-limit.module';
import { applyTrustProxy } from './trust-proxy';

/**
 * The rate limiter end to end: a real Nest app with the real module, filter
 * and global prefix, in front of probe controllers mounted at the same paths
 * as the routes the central map names. Limits are injected through config so
 * each case needs only a handful of requests.
 */
const SECRET = 'rate-limit-spec-jwt-secret';
const SERVICE_KEY = 'rate-limit-spec-service-key-0123456789';
const jwt = new JwtService({ secret: SECRET });

@Controller('otp')
class OtpProbe {
  @Post('send')
  send() {
    return { sent: true };
  }

  @Post('verify')
  verify() {
    return { verified: true };
  }
}

@Controller('things')
class ThingsProbe {
  @Get()
  list() {
    return [];
  }

  @Get('other')
  other() {
    return [];
  }
}

async function createApp(
  config: Record<string, unknown>,
  trustProxy?: string,
): Promise<NestExpressApplication> {
  @Global()
  @Module({
    imports: [JwtModule.register({ secret: SECRET })],
    providers: [
      { provide: ConfigService, useValue: new ConfigService(config) },
      ClerkTokenVerifier,
    ],
    exports: [ConfigService, JwtModule, ClerkTokenVerifier],
  })
  class TestCoreModule {}

  const moduleRef = await Test.createTestingModule({
    imports: [TestCoreModule, RateLimitModule],
    controllers: [OtpProbe, ThingsProbe],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: false,
  });
  applyTrustProxy(app, trustProxy);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  return app;
}

describe('Rate limiting', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  const server = () => app!.getHttpServer() as Parameters<typeof request>[0];

  it('refuses the 6th OTP send from one client with a 429 in the API error shape', async () => {
    app = await createApp({ THROTTLE_GLOBAL_LIMIT: 100 });

    for (let i = 0; i < 5; i++) {
      await request(server()).post('/api/otp/send').expect(201);
    }
    const refused = await request(server()).post('/api/otp/send').expect(429);

    expect(refused.body).toEqual({
      success: false,
      statusCode: 429,
      message: expect.any(String) as unknown,
    });
    expect(Number(refused.headers['retry-after'])).toBeGreaterThan(0);

    // The limit is per route: verifying a code is a different bucket.
    await request(server()).post('/api/otp/verify').expect(201);
  });

  it('never limits the website server when it presents the service key', async () => {
    app = await createApp({
      THROTTLE_GLOBAL_LIMIT: 100,
      SERVICE_AUTH_KEY: SERVICE_KEY,
    });

    for (let i = 0; i < 10; i++) {
      await request(server())
        .post('/api/otp/send')
        .set('x-service-key', SERVICE_KEY)
        .expect(201);
    }

    // The same route is limited for everyone else, including a wrong key.
    for (let i = 0; i < 5; i++) {
      await request(server())
        .post('/api/otp/send')
        .set('x-service-key', 'not-the-key-but-long-enough-0123456789')
        .expect(201);
    }
    await request(server())
      .post('/api/otp/send')
      .set('x-service-key', 'not-the-key-but-long-enough-0123456789')
      .expect(429);
  });

  it("limits each visitor the website server relays for, by the visitor's IP", async () => {
    app = await createApp({
      THROTTLE_GLOBAL_LIMIT: 100,
      SERVICE_AUTH_KEY: SERVICE_KEY,
    });
    const relayFor = (ip: string) =>
      request(server())
        .post('/api/otp/send')
        .set('x-service-key', SERVICE_KEY)
        .set('x-visitor-ip', ip);

    // Every visitor's OTP request arrives from the website server's one IP;
    // without the relayed address they would all share one bucket of 5.
    for (let i = 0; i < 5; i++) await relayFor('198.51.100.7').expect(201);
    await relayFor('198.51.100.7').expect(429);
    await relayFor('198.51.100.8').expect(201);
  });

  it('ignores a visitor IP sent without the service key', async () => {
    app = await createApp({
      THROTTLE_GLOBAL_LIMIT: 100,
      SERVICE_AUTH_KEY: SERVICE_KEY,
    });

    // Anyone could otherwise claim a new address on each request.
    for (let i = 0; i < 5; i++) {
      await request(server())
        .post('/api/otp/send')
        .set('x-visitor-ip', `198.51.100.${i}`)
        .expect(201);
    }
    await request(server())
      .post('/api/otp/send')
      .set('x-visitor-ip', '198.51.100.99')
      .expect(429);
  });

  it('treats a malformed relayed visitor IP as an internal server call', async () => {
    app = await createApp({
      THROTTLE_GLOBAL_LIMIT: 100,
      SERVICE_AUTH_KEY: SERVICE_KEY,
    });
    for (let i = 0; i < 8; i++) {
      await request(server())
        .post('/api/otp/send')
        .set('x-service-key', SERVICE_KEY)
        .set('x-visitor-ip', 'not-an-ip')
        .expect(201);
    }
  });

  it('tracks token callers by their token, not by the IP they share', async () => {
    app = await createApp({ THROTTLE_GLOBAL_LIMIT: 3 });
    const alice = `Bearer ${jwt.sign({ sub: 'alice', email: 'a@example.com' })}`;
    const bob = `Bearer ${jwt.sign({ sub: 'bob', email: 'b@example.com' })}`;

    // Anonymous traffic from this IP uses up the IP's bucket...
    for (let i = 0; i < 3; i++) {
      await request(server()).get('/api/things').expect(200);
    }
    await request(server()).get('/api/things').expect(429);

    // ...while each signed-in caller from the same IP has a bucket of their own.
    for (let i = 0; i < 3; i++) {
      await request(server())
        .get('/api/things')
        .set('Authorization', alice)
        .expect(200);
    }
    await request(server())
      .get('/api/things')
      .set('Authorization', alice)
      .expect(429);
    await request(server())
      .get('/api/things')
      .set('Authorization', bob)
      .expect(200);
  });

  it('does not hand a fresh bucket to a token it cannot verify', async () => {
    app = await createApp({ THROTTLE_GLOBAL_LIMIT: 2 });
    const forged = (n: number) =>
      `Bearer ${jwt.sign({ sub: `x${n}` }, { secret: 'someone-elses-secret' })}`;

    await request(server()).get('/api/things').expect(200);
    await request(server()).get('/api/things').expect(200);

    // Rotating made-up tokens would otherwise dodge every limit.
    await request(server())
      .get('/api/things')
      .set('Authorization', forged(1))
      .expect(429);
    await request(server())
      .get('/api/things')
      .set('Authorization', 'Bearer not-even-a-jwt')
      .expect(429);
  });

  it('gives routes not in the map the global limit, shared across routes', async () => {
    app = await createApp({ THROTTLE_GLOBAL_LIMIT: 3 });

    await request(server()).get('/api/things').expect(200);
    await request(server()).get('/api/things/other').expect(200);
    await request(server()).get('/api/things').expect(200);
    const refused = await request(server())
      .get('/api/things/other')
      .expect(429);

    expect(refused.body).toMatchObject({ success: false, statusCode: 429 });
  });

  it('ignores X-Forwarded-For unless TRUST_PROXY says how many hops to trust', async () => {
    app = await createApp({ THROTTLE_GLOBAL_LIMIT: 2 });

    await request(server())
      .get('/api/things')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(200);
    await request(server())
      .get('/api/things')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(200);
    // A made-up header is not a new client.
    await request(server())
      .get('/api/things')
      .set('X-Forwarded-For', '203.0.113.3')
      .expect(429);
  });

  it('limits each forwarded client separately behind a trusted proxy', async () => {
    app = await createApp({ THROTTLE_GLOBAL_LIMIT: 2 }, '1');
    const from = (ip: string) =>
      request(server()).get('/api/things').set('X-Forwarded-For', ip);

    await from('203.0.113.1').expect(200);
    await from('203.0.113.1').expect(200);
    await from('203.0.113.1').expect(429);
    await from('203.0.113.2').expect(200);
  });
});
