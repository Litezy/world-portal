import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { SendGridService } from '../mail/sendgrid.service';
import { PrismaService } from '../prisma/prisma.service';
import { LOOKUP_TOKEN_AUDIENCE, lookupTokenEmail } from '../auth/lookup-token';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';

describe('OtpService', () => {
  let service: OtpService;

  const jwt = new JwtService({ secret: 'test-secret-for-otp-lookup' });

  const mockSendGridService = {
    sendOtpEmail: jest
      .fn<Promise<boolean>, [string, string]>()
      .mockResolvedValue(true),
  };

  const mockPrismaService = {
    profile: { findUnique: jest.fn() },
    agencyUser: { findUnique: jest.fn() },
    agency: { findFirst: jest.fn() },
    visaDocumentation: { findFirst: jest.fn() },
    passportApplication: { findFirst: jest.fn() },
    hireBooking: { findFirst: jest.fn() },
  };

  const compileService = async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: SendGridService, useValue: mockSendGridService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    return module.get<OtpService>(OtpService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await compileService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /** The dev bypass is opt-in: ENABLE_OTP_DEV_BYPASS must say "true". */
  async function withDevBypass(run: () => Promise<void>) {
    const originalEnv = process.env.ENABLE_OTP_DEV_BYPASS;
    process.env.ENABLE_OTP_DEV_BYPASS = 'true';
    try {
      await run();
    } finally {
      if (originalEnv !== undefined) {
        process.env.ENABLE_OTP_DEV_BYPASS = originalEnv;
      } else {
        delete process.env.ENABLE_OTP_DEV_BYPASS;
      }
    }
  }

  it('preserves intentional bypass for an email without an account pending parent auth', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue(null);
    mockPrismaService.agencyUser.findUnique.mockResolvedValue(null);
    mockPrismaService.agency.findFirst.mockResolvedValue(null);
    mockPrismaService.visaDocumentation.findFirst.mockResolvedValue(null);
    mockPrismaService.passportApplication.findFirst.mockResolvedValue(null);
    mockPrismaService.hireBooking.findFirst.mockResolvedValue(null);

    await withDevBypass(async () => {
      await expect(
        service.verifyOtp({
          email: 'nonexistent@example.com',
          code: '000000',
        }),
      ).resolves.toMatchObject({ verified: true, profileId: null });
    });
  });

  it('bypasses SendGrid delivery when ENABLE_OTP_DEV_BYPASS is true', async () => {
    const originalEnv = process.env.ENABLE_OTP_DEV_BYPASS;
    try {
      process.env.ENABLE_OTP_DEV_BYPASS = 'true';
      const result = await service.sendOtp({ email: 'bypass@example.com' });
      expect(result.success).toBe(true);
      expect(mockSendGridService.sendOtpEmail).not.toHaveBeenCalled();

      await expect(
        service.verifyOtp({ email: 'bypass@example.com', code: '000000' }),
      ).resolves.toMatchObject({ verified: true });
    } finally {
      if (originalEnv !== undefined) {
        process.env.ENABLE_OTP_DEV_BYPASS = originalEnv;
      } else {
        delete process.env.ENABLE_OTP_DEV_BYPASS;
      }
    }
  });

  describe('when dev bypass is disabled', () => {
    const originalEnv = process.env.ENABLE_OTP_DEV_BYPASS;

    beforeEach(() => {
      process.env.ENABLE_OTP_DEV_BYPASS = 'false';
    });

    afterAll(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_OTP_DEV_BYPASS = originalEnv;
      } else {
        delete process.env.ENABLE_OTP_DEV_BYPASS;
      }
    });

    it('delivers the generated code and accepts it only once', async () => {
      await service.sendOtp({ email: ' Mailbox@Example.com ' });
      const [email, code] = mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;
      expect(email).toBe('mailbox@example.com');
      expect(code).toMatch(/^\d{6}$/);
      await expect(service.verifyOtp({ email, code })).resolves.toMatchObject({
        verified: true,
      });
      await expect(service.verifyOtp({ email, code })).rejects.toThrow(
        BadRequestException,
      );
    });

    it.each(['false', 'throw'])(
      'rejects failed delivery (%s) and invalidates the unsent code',
      async (failure) => {
        if (failure === 'false')
          mockSendGridService.sendOtpEmail.mockResolvedValueOnce(false);
        else
          mockSendGridService.sendOtpEmail.mockRejectedValueOnce(
            new Error('provider failure'),
          );
        await expect(
          service.sendOtp({ email: 'failure@example.com' }),
        ).rejects.toThrow(ServiceUnavailableException);
        const [email, code] =
          mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;
        await expect(service.verifyOtp({ email, code })).rejects.toThrow(
          BadRequestException,
        );
      },
    );
  });

  it('should verify successfully if email account exists in DB', async () => {
    mockPrismaService.profile.findUnique.mockResolvedValue({
      id: 'prof-1',
      email: 'registered@example.com',
    });

    await withDevBypass(async () => {
      const result = await service.verifyOtp({
        email: 'registered@example.com',
        code: '000000',
      });

      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
      expect(result.profileId).toBe('prof-1');
    });
  });

  /**
   * Verify is public (the agency portal signs in with it), so it must hold up
   * against guessing: a six-digit code is a million tries at most.
   */
  describe('brute-force resistance (dev bypass not configured)', () => {
    const originalEnv = process.env.ENABLE_OTP_DEV_BYPASS;

    beforeEach(() => {
      delete process.env.ENABLE_OTP_DEV_BYPASS;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    afterAll(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_OTP_DEV_BYPASS = originalEnv;
      } else {
        delete process.env.ENABLE_OTP_DEV_BYPASS;
      }
    });

    async function sendCode(email: string) {
      await service.sendOtp({ email });
      const [, code] = mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;
      return code;
    }

    const wrong = (code: string) =>
      String(((Number(code) - 100000 + 1) % 900000) + 100000);

    it('refuses the dev bypass code unless it is switched on', async () => {
      const code = await sendCode('owner@example.com');
      await expect(
        service.verifyOtp({ email: 'owner@example.com', code: '000000' }),
      ).rejects.toThrow(BadRequestException);
      // The refused bypass counted as a wrong guess, but the code still works.
      await expect(
        service.verifyOtp({ email: 'owner@example.com', code }),
      ).resolves.toMatchObject({ verified: true });
    });

    it('invalidates the code after 5 wrong attempts', async () => {
      const code = await sendCode('owner@example.com');
      for (let attempt = 0; attempt < 5; attempt++) {
        await expect(
          service.verifyOtp({ email: 'owner@example.com', code: wrong(code) }),
        ).rejects.toThrow(BadRequestException);
      }
      await expect(
        service.verifyOtp({ email: 'owner@example.com', code }),
      ).rejects.toThrow(BadRequestException);
    });

    it('still accepts the right code after fewer than 5 wrong attempts', async () => {
      const code = await sendCode('owner@example.com');
      for (let attempt = 0; attempt < 4; attempt++) {
        await expect(
          service.verifyOtp({ email: 'owner@example.com', code: wrong(code) }),
        ).rejects.toThrow(BadRequestException);
      }
      await expect(
        service.verifyOtp({ email: 'owner@example.com', code }),
      ).resolves.toMatchObject({ verified: true });
    });

    it('refuses a code once it has expired', async () => {
      jest.useFakeTimers({ now: new Date('2026-01-01T10:00:00Z') });
      const code = await sendCode('owner@example.com');
      jest.setSystemTime(new Date('2026-01-01T10:10:01Z'));
      await expect(
        service.verifyOtp({ email: 'owner@example.com', code }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cannot replay a code that was already used', async () => {
      const code = await sendCode('owner@example.com');
      await service.verifyOtp({ email: 'owner@example.com', code });
      await expect(
        service.verifyOtp({ email: 'owner@example.com', code }),
      ).rejects.toThrow(BadRequestException);
    });

    it('compares codes in constant time', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto') as typeof import('crypto');
      const spy = jest.spyOn(crypto, 'timingSafeEqual');
      try {
        const code = await sendCode('owner@example.com');
        await service.verifyOtp({ email: 'owner@example.com', code });
        expect(spy).toHaveBeenCalled();
      } finally {
        spy.mockRestore();
      }
    });

    it('answers send the same way whether or not the email has an account', async () => {
      mockPrismaService.profile.findUnique.mockResolvedValue({
        id: 'prof-1',
        email: 'registered@example.com',
      });
      const known = await service.sendOtp({ email: 'registered@example.com' });
      mockPrismaService.profile.findUnique.mockResolvedValue(null);
      const unknown = await service.sendOtp({ email: 'nobody@example.com' });

      expect(known).toEqual(unknown);
      expect(mockPrismaService.profile.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.agency.findFirst).not.toHaveBeenCalled();
    });

    /**
     * /track's status lookup needs proof the visitor controls the email, not
     * just its spelling: verify mints a short-lived lookup token for it.
     */
    describe('lookup token', () => {
      it('is returned for the email the code was sent to, for 30 minutes', async () => {
        await service.sendOtp({ email: ' Owner@Example.com ' });
        const [, code] = mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;

        const result = await service.verifyOtp({
          email: 'owner@example.com',
          code,
        });

        expect(typeof result.lookupToken).toBe('string');
        const token = result.lookupToken!;
        expect(lookupTokenEmail(jwt, token)).toBe('owner@example.com');
        const claims = jwt.decode<{ aud: string; iat: number; exp: number }>(
          token,
        );
        expect(claims.aud).toBe(LOOKUP_TOKEN_AUDIENCE);
        expect(claims.exp - claims.iat).toBe(30 * 60);
      });

      it("is never minted with another email's code", async () => {
        const code = await sendCode('owner@example.com');
        await expect(
          service.verifyOtp({ email: 'someone-else@example.com', code }),
        ).rejects.toThrow(BadRequestException);
      });

      it('is not minted for a dev bypass code nobody was sent', async () => {
        await withDevBypass(async () => {
          const result = await service.verifyOtp({
            email: 'never-sent@example.com',
            code: '000000',
          });
          expect(result.verified).toBe(true);
          expect(result.lookupToken).toBeUndefined();
        });
      });
    });
  });

  /**
   * The route limits count callers by IP or token, which a botnet or a stream
   * of fresh lookup tokens steps around. These limits count by the mailbox
   * being targeted, whoever asks: how often it is sent a code, and how many
   * wrong codes are tried against it, across every code it is sent.
   */
  describe('per-email limits (dev bypass not configured)', () => {
    const saved = {
      ENABLE_OTP_DEV_BYPASS: process.env.ENABLE_OTP_DEV_BYPASS,
      OTP_SENDS_PER_EMAIL_PER_HOUR: process.env.OTP_SENDS_PER_EMAIL_PER_HOUR,
      OTP_FAILURES_PER_EMAIL_PER_HOUR:
        process.env.OTP_FAILURES_PER_EMAIL_PER_HOUR,
    };
    const restore = () => {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    };

    beforeEach(async () => {
      delete process.env.ENABLE_OTP_DEV_BYPASS;
      delete process.env.OTP_SENDS_PER_EMAIL_PER_HOUR;
      delete process.env.OTP_FAILURES_PER_EMAIL_PER_HOUR;
      jest.useFakeTimers({ now: new Date('2026-01-01T10:00:00Z') });
      service = await compileService();
    });

    afterEach(() => {
      jest.useRealTimers();
      restore();
    });

    const target = 'target@example.com';

    async function sendCode(email = target) {
      await service.sendOtp({ email });
      const [, code] = mockSendGridService.sendOtpEmail.mock.calls.at(-1)!;
      return code;
    }

    const wrong = (code: string) =>
      String(((Number(code) - 100000 + 1) % 900000) + 100000);

    async function failTimes(code: string, times: number, email = target) {
      for (let i = 0; i < times; i++) {
        await expect(
          service.verifyOtp({ email, code: wrong(code) }),
        ).rejects.toThrow(BadRequestException);
      }
    }

    const status = (error: unknown) =>
      error instanceof HttpException ? error.getStatus() : undefined;

    it('sends one email at most 5 codes an hour, then answers 429', async () => {
      for (let i = 0; i < 5; i++) {
        await expect(service.sendOtp({ email: target })).resolves.toEqual(
          expect.objectContaining({ success: true }),
        );
      }

      const refused = await service
        .sendOtp({ email: target })
        .catch((e: unknown) => e);
      expect(status(refused)).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockSendGridService.sendOtpEmail).toHaveBeenCalledTimes(5);
    });

    it('counts the email however it is written', async () => {
      for (let i = 0; i < 5; i++) {
        await service.sendOtp({
          email: i % 2 ? ' TARGET@example.com ' : target,
        });
      }
      const refused = await service
        .sendOtp({ email: 'Target@Example.com' })
        .catch((e: unknown) => e);
      expect(status(refused)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('limits each email on its own', async () => {
      for (let i = 0; i < 5; i++) await service.sendOtp({ email: target });
      await expect(
        service.sendOtp({ email: 'someone-else@example.com' }),
      ).resolves.toEqual(expect.objectContaining({ success: true }));
    });

    it('sends again once the hour has rolled past', async () => {
      for (let i = 0; i < 5; i++) await service.sendOtp({ email: target });
      jest.setSystemTime(new Date('2026-01-01T11:00:01Z'));
      await expect(service.sendOtp({ email: target })).resolves.toEqual(
        expect.objectContaining({ success: true }),
      );
    });

    it('answers a limited email exactly as any other: no account lookup', async () => {
      for (let i = 0; i < 5; i++) await service.sendOtp({ email: target });
      await service.sendOtp({ email: target }).catch(() => undefined);
      expect(mockPrismaService.profile.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.agency.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.agencyUser.findUnique).not.toHaveBeenCalled();
    });

    it('takes OTP_SENDS_PER_EMAIL_PER_HOUR from the environment', async () => {
      process.env.OTP_SENDS_PER_EMAIL_PER_HOUR = '2';
      service = await compileService();
      await service.sendOtp({ email: target });
      await service.sendOtp({ email: target });
      const refused = await service
        .sendOtp({ email: target })
        .catch((e: unknown) => e);
      expect(status(refused)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('refuses to start with a malformed limit', async () => {
      process.env.OTP_FAILURES_PER_EMAIL_PER_HOUR = 'ten';
      await expect(compileService()).rejects.toThrow(
        /OTP_FAILURES_PER_EMAIL_PER_HOUR/,
      );
    });

    it('locks verify after 10 wrong codes, counted across resends', async () => {
      // A new code must not wipe the slate: 4 + 4 + 2 wrong guesses over
      // three codes reach the limit just as 10 against one would.
      await failTimes(await sendCode(), 4);
      await failTimes(await sendCode(), 4);
      const code = await sendCode();
      await failTimes(code, 2);

      const refused = await service
        .verifyOtp({ email: target, code })
        .catch((e: unknown) => e);
      expect(status(refused)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('locks verify after two codes are each guessed to death', async () => {
      // The per-code limit (5) throws a code away; the per-email limit is
      // what stops the next code being guessed at too.
      await failTimes(await sendCode(), 5);
      await failTimes(await sendCode(), 5);
      const code = await sendCode();

      const refused = await service
        .verifyOtp({ email: target, code })
        .catch((e: unknown) => e);
      expect(status(refused)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('refuses the right code while locked, and accepts one after the hour', async () => {
      await failTimes(await sendCode(), 5);
      const code = await sendCode();
      await failTimes(code, 4);
      await failTimes(code, 1); // the 10th wrong code; this one invalidates it
      const fresh = await sendCode();

      const refused = await service
        .verifyOtp({ email: target, code: fresh })
        .catch((e: unknown) => e);
      expect(status(refused)).toBe(HttpStatus.TOO_MANY_REQUESTS);
      // A refused verify while locked mints nothing.
      expect(refused).not.toHaveProperty('lookupToken');

      jest.setSystemTime(new Date('2026-01-01T11:00:01Z'));
      const later = await sendCode();
      await expect(
        service.verifyOtp({ email: target, code: later }),
      ).resolves.toMatchObject({ verified: true });
    });

    it('counts wrong codes for each email on its own', async () => {
      await failTimes(await sendCode(), 5);
      await failTimes(await sendCode(), 5);

      const other = 'other@example.com';
      const code = await sendCode(other);
      await expect(
        service.verifyOtp({ email: other, code }),
      ).resolves.toMatchObject({ verified: true });
    });

    it('allows 9 wrong codes and still accepts the right one', async () => {
      await failTimes(await sendCode(), 5);
      const code = await sendCode();
      await failTimes(code, 4);
      await expect(
        service.verifyOtp({ email: target, code }),
      ).resolves.toMatchObject({ verified: true });
    });
  });

  /**
   * The dev bypass accepts one fixed code for every email. It must never run
   * in production: the service refuses to start, and refuses the code anyway.
   */
  describe('dev bypass in production', () => {
    const saved = {
      NODE_ENV: process.env.NODE_ENV,
      ENABLE_OTP_DEV_BYPASS: process.env.ENABLE_OTP_DEV_BYPASS,
      ENABLE_MOCK_AUTH: process.env.ENABLE_MOCK_AUTH,
    };

    const setEnv = (env: Partial<typeof saved>) => {
      for (const [key, value] of Object.entries(env)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    };

    afterEach(() => setEnv(saved));

    it('refuses to start with ENABLE_OTP_DEV_BYPASS=true', async () => {
      setEnv({
        NODE_ENV: 'production',
        ENABLE_OTP_DEV_BYPASS: 'true',
        ENABLE_MOCK_AUTH: undefined,
      });
      await expect(compileService()).rejects.toThrow(/ENABLE_OTP_DEV_BYPASS/);
    });

    it('starts without the bypass', async () => {
      setEnv({
        NODE_ENV: 'production',
        ENABLE_OTP_DEV_BYPASS: undefined,
        ENABLE_MOCK_AUTH: undefined,
      });
      await expect(compileService()).resolves.toBeInstanceOf(OtpService);
    });

    it('allows it on a mock-auth (sample data) deployment', async () => {
      setEnv({
        NODE_ENV: 'production',
        ENABLE_OTP_DEV_BYPASS: 'true',
        ENABLE_MOCK_AUTH: 'true',
      });
      await expect(compileService()).resolves.toBeInstanceOf(OtpService);
    });

    it('refuses the bypass code even if it is switched on after start', async () => {
      setEnv({
        NODE_ENV: 'production',
        ENABLE_OTP_DEV_BYPASS: undefined,
        ENABLE_MOCK_AUTH: undefined,
      });
      const started = await compileService();
      setEnv({ ENABLE_OTP_DEV_BYPASS: 'true' });
      await expect(
        started.verifyOtp({ email: 'owner@example.com', code: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
