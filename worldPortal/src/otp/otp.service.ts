import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SendGridService } from '../mail/sendgrid.service';
import { PrismaService } from '../prisma/prisma.service';
import { signLookupToken } from '../auth/lookup-token';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { RollingWindowCounter } from './rolling-window-counter';

/** How long a sent code stays valid. */
const CODE_TTL_MS = 10 * 60 * 1000;
/** Wrong guesses one code survives; the last one invalidates it. */
const MAX_ATTEMPTS = 5;
/** The window the per-email limits below count over. */
const HOUR_MS = 60 * 60 * 1000;
/** Codes one email may be sent per rolling hour (OTP_SENDS_PER_EMAIL_PER_HOUR). */
const DEFAULT_SENDS_PER_EMAIL_PER_HOUR = 5;
/**
 * Wrong codes one email may take per rolling hour, across every code it is
 * sent (OTP_FAILURES_PER_EMAIL_PER_HOUR).
 */
const DEFAULT_FAILURES_PER_EMAIL_PER_HOUR = 10;

export interface OtpVerifyResult {
  success: true;
  verified: true;
  email: string;
  profileId: string | null;
  message: string;
  /**
   * Proof for /track's status lookup that the caller controls `email`
   * (auth/lookup-token.ts). Only when a code was actually sent to it.
   */
  lookupToken?: string;
}

interface OtpEntry {
  /** SHA-256 of the code, so comparisons are fixed-length and constant-time. */
  digest: Buffer;
  expiresAt: number;
  attempts: number;
}

const digestOf = (code: string) => createHash('sha256').update(code).digest();

/** Constant-time: how many leading digits match never shows in the timing. */
function codeMatches(expected: Buffer, provided: string): boolean {
  return timingSafeEqual(expected, digestOf(provided));
}

type Env = Record<string, string | undefined>;

/** A real production deployment (a mock-auth sample-data staging is not). */
const isRealProduction = (env: Env) =>
  env.NODE_ENV === 'production' && env.ENABLE_MOCK_AUTH !== 'true';

/**
 * The fixed dev code is accepted only when ENABLE_OTP_DEV_BYPASS is exactly
 * "true", and never in real production. It used to be on unless the variable
 * said "false", so a deploy that never set it accepted 000000 for every email.
 */
function devBypassEnabled(env: Env = process.env): boolean {
  return env.ENABLE_OTP_DEV_BYPASS === 'true' && !isRealProduction(env);
}

/**
 * A per-email limit from the environment: `fallback` when unset, a whole
 * number above zero otherwise. Anything else throws, so a typo fails the boot
 * instead of quietly leaving the limit off.
 */
export function perEmailLimit(
  env: Env,
  name: string,
  fallback: number,
): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a whole number above zero.`);
  }
  return value;
}

const tooMany = (message: string, waitMs: number) =>
  new HttpException(
    `${message} Try again in ${Math.max(1, Math.ceil(waitMs / 60_000))} minute(s).`,
    HttpStatus.TOO_MANY_REQUESTS,
  );

/**
 * Start-up check: real production refuses ENABLE_OTP_DEV_BYPASS=true outright
 * rather than quietly ignoring it, so the misconfiguration is seen at deploy.
 */
export function assertDevBypassAllowed(env: Env): void {
  if (env.ENABLE_OTP_DEV_BYPASS === 'true' && isRealProduction(env)) {
    throw new Error(
      'ENABLE_OTP_DEV_BYPASS=true is refused in production: it accepts one fixed code for every email. Unset it (it is only for local development or a mock-auth staging).',
    );
  }
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpStore = new Map<string, OtpEntry>();
  private readonly verifiedStore = new Map<string, Date>();
  /**
   * Per target email, whoever asks: the route limits count callers by IP or
   * token, which many IPs (or many minted tokens) step around. These count
   * the mailbox being sent codes and the wrong codes tried against it.
   */
  private readonly sendsPerEmail = new RollingWindowCounter(HOUR_MS);
  private readonly failuresPerEmail = new RollingWindowCounter(HOUR_MS);
  private readonly maxSendsPerEmail: number;
  private readonly maxFailuresPerEmail: number;

  constructor(
    private readonly sendGridService: SendGridService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    assertDevBypassAllowed(process.env);
    this.maxSendsPerEmail = perEmailLimit(
      process.env,
      'OTP_SENDS_PER_EMAIL_PER_HOUR',
      DEFAULT_SENDS_PER_EMAIL_PER_HOUR,
    );
    this.maxFailuresPerEmail = perEmailLimit(
      process.env,
      'OTP_FAILURES_PER_EMAIL_PER_HOUR',
      DEFAULT_FAILURES_PER_EMAIL_PER_HOUR,
    );
  }

  async sendOtp(dto: SendOtpDto) {
    const emailKey = dto.email.trim().toLowerCase();

    // Counted per mailbox, before anything is sent. The answer depends only
    // on how often this address was sent a code, never on whether it belongs
    // to anyone. A refused send is not counted, so it can't extend the wait.
    if (this.sendsPerEmail.count(emailKey) >= this.maxSendsPerEmail) {
      this.logger.warn(`[OTP SEND LIMITED] Hourly send limit for ${emailKey}`);
      throw tooMany(
        'Too many verification codes have been sent to this email.',
        this.sendsPerEmail.msUntilNextFree(emailKey),
      );
    }
    this.sendsPerEmail.record(emailKey);

    const isDevBypassEnabled = devBypassEnabled();
    const bypassCode = process.env.OTP_DEV_BYPASS || '000000';
    const code = isDevBypassEnabled
      ? bypassCode
      : randomInt(100000, 1000000).toString();

    // A new code replaces the old one and starts with a fresh attempt count.
    // Nothing here looks the email up: the answer is the same for everyone.
    const entry: OtpEntry = {
      digest: digestOf(code),
      expiresAt: Date.now() + CODE_TTL_MS,
      attempts: 0,
    };
    this.otpStore.set(emailKey, entry);

    if (isDevBypassEnabled) {
      this.logger.log(
        `[OTP DEV BYPASS] Dev bypass enabled. Skipping SendGrid email for ${emailKey}. Dev OTP: ${code}`,
      );
      return {
        success: true,
        message: 'Verification OTP sent to your email address.',
        expiresIn: '10m',
      };
    }

    try {
      const sent = await this.sendGridService.sendOtpEmail(emailKey, code);
      if (!sent) throw new Error('OTP delivery was not accepted');
    } catch {
      // A failed older request must not delete a newer code for this email.
      if (this.otpStore.get(emailKey) === entry) {
        this.otpStore.delete(emailKey);
      }
      this.logger.warn('OTP email delivery failed');
      throw new ServiceUnavailableException(
        'Could not send the verification code. Please try again.',
      );
    }

    return {
      success: true,
      message: 'Verification OTP sent to your email address.',
      expiresIn: '10m',
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<OtpVerifyResult> {
    const emailKey = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    // Locked before the code is even looked at: once this mailbox has taken
    // its hourly share of wrong codes, across every code it was sent, even
    // the right one is refused until the oldest of them ages out. Otherwise
    // requesting a new code would restart the guessing.
    if (this.failuresPerEmail.count(emailKey) >= this.maxFailuresPerEmail) {
      this.logger.warn(
        `[OTP VERIFY LOCKED] Hourly wrong-code limit for ${emailKey}`,
      );
      throw tooMany(
        'Too many wrong codes have been tried for this email.',
        this.failuresPerEmail.msUntilNextFree(emailKey),
      );
    }

    const bypassCode = process.env.OTP_DEV_BYPASS || '000000';

    // Whether a code was actually sent to this email (and is now used up).
    // Only then does the caller get a lookup token for it.
    let codeWasSent: boolean;
    if (devBypassEnabled() && codeMatches(digestOf(bypassCode), code)) {
      this.logger.log(
        `[OTP VERIFY BYPASS] Dev bypass code used for ${emailKey}`,
      );
      codeWasSent = this.otpStore.delete(emailKey);
    } else {
      try {
        this.consumeCode(emailKey, code);
      } catch (error) {
        // Every refused code counts against the mailbox: wrong, expired, or
        // tried when none was sent.
        this.failuresPerEmail.record(emailKey);
        throw error;
      }
      codeWasSent = true;
    }

    // Verification proves control of the mailbox, not that an account exists:
    // whether the email belongs to anyone is the caller's next question
    // (the agency portal looks its agency up itself). Only the desk profile id
    // is returned, and only to someone who just proved they own the address.
    const profile = await this.prisma.profile
      .findUnique({ where: { email: emailKey } })
      .catch(() => null);

    // Mark email as verified for 30 minutes
    this.verifiedStore.set(emailKey, new Date(Date.now() + 30 * 60 * 1000));
    this.logger.log(`[OTP VERIFIED SUCCESS] Email: ${emailKey}`);

    return {
      success: true,
      verified: true,
      email: emailKey,
      profileId: profile?.id || null,
      message: 'Email verified successfully.',
      ...(codeWasSent
        ? { lookupToken: signLookupToken(this.jwtService, emailKey) }
        : {}),
    };
  }

  /**
   * Checks `code` against the one sent to `emailKey` and uses it up. Runs
   * without awaiting, so two requests racing with the right code cannot both
   * pass. Throws a 400 for a missing, expired or wrong code; the fifth wrong
   * guess deletes the code, so guessing means requesting a new one each time.
   */
  private consumeCode(emailKey: string, code: string): void {
    const entry = this.otpStore.get(emailKey);

    if (!entry) {
      this.logger.warn(`[OTP VERIFY FAILED] No active OTP for ${emailKey}`);
      throw new BadRequestException(
        'Verification code has expired or is invalid.',
      );
    }

    if (Date.now() > entry.expiresAt) {
      this.otpStore.delete(emailKey);
      this.logger.warn(`[OTP VERIFY FAILED] OTP expired for ${emailKey}`);
      throw new BadRequestException(
        'Verification code has expired. Please request a new one.',
      );
    }

    if (!codeMatches(entry.digest, code)) {
      entry.attempts += 1;
      if (entry.attempts >= MAX_ATTEMPTS) {
        this.otpStore.delete(emailKey);
        this.logger.warn(
          `[OTP VERIFY FAILED] Too many wrong codes for ${emailKey}; code invalidated`,
        );
        throw new BadRequestException(
          'Too many wrong attempts. Please request a new code.',
        );
      }
      this.logger.warn(`[OTP VERIFY FAILED] Wrong code for ${emailKey}`);
      throw new BadRequestException('Invalid verification code.');
    }

    // Used up before anything else happens: a code works exactly once.
    this.otpStore.delete(emailKey);
  }

  isEmailVerified(email: string): boolean {
    const emailKey = email.trim().toLowerCase();
    const expiresAt = this.verifiedStore.get(emailKey);
    if (!expiresAt) return false;
    if (new Date() > expiresAt) {
      this.verifiedStore.delete(emailKey);
      return false;
    }
    return true;
  }
}
