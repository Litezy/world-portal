import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Applicant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClerkIdentityService,
  WorldStreetIdentity,
} from '../auth/clerk/clerk-identity.service';

/** Who owns a new application: the WorldStreet user and their verified email. */
export interface ApplicationOwner {
  clerkUserId: string;
  email: string;
}

export interface JoinResult {
  applicant: Applicant;
  identity: WorldStreetIdentity;
  /** Pre-existing records attached to this account by verified email. */
  linked: { visa: number; passport: number; hires: number };
}

/**
 * E-Embassy membership for WorldStreet users.
 *
 * Every WorldStreet account can use E-Embassy; "joining" only records that the
 * person has started, keyed by their Clerk user id. Joining is idempotent, so
 * a first visit, a returning visit and a double-submit all converge on one row.
 */
@Injectable()
export class ApplicantService {
  private readonly logger = new Logger(ApplicantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly identities: ClerkIdentityService,
  ) {}

  /**
   * Joins (or re-joins) the caller and attaches any application they submitted
   * before accounts existed, matched on their WorldStreet-verified email.
   */
  async join(clerkUserId: string): Promise<JoinResult> {
    const identity = await this.requireIdentity(clerkUserId);
    const applicant = await this.upsert(clerkUserId);
    this.assertNotSuspended(applicant);
    const linked = await this.claimRecordsByEmail(clerkUserId, identity);
    return { applicant, identity, linked };
  }

  /** The caller's membership row (null before their first join) and identity. */
  async getMe(clerkUserId: string) {
    const identity = await this.requireIdentity(clerkUserId);
    const applicant = await this.prisma.applicant.findUnique({
      where: { clerkUserId },
    });
    return { applicant, identity };
  }

  /**
   * The one guard every applicant write goes through: joins the caller if
   * needed, refuses a suspended applicant, and returns the verified email the
   * new record will be filed under.
   */
  async requireActiveApplicant(clerkUserId: string): Promise<ApplicationOwner> {
    const identity = await this.requireIdentity(clerkUserId);
    const applicant = await this.upsert(clerkUserId);
    this.assertNotSuspended(applicant);

    if (!identity.email || !identity.emailVerified) {
      throw new ForbiddenException(
        'Add and verify an email address on your WorldStreet account before applying.',
      );
    }
    return { clerkUserId, email: identity.email };
  }

  private async requireIdentity(
    clerkUserId: string,
  ): Promise<WorldStreetIdentity> {
    const identity = await this.identities.getIdentity(clerkUserId);
    if (!identity) {
      // A valid token for a user Clerk does not know almost always means the
      // token and CLERK_SECRET_KEY come from different Clerk instances.
      this.logger.error(
        `Verified session for clerkUserId=${clerkUserId} but Clerk has no such user — check that CLERK_SECRET_KEY belongs to WorldStreet's instance`,
      );
      throw new InternalServerErrorException(
        'Your WorldStreet account could not be resolved.',
      );
    }
    return identity;
  }

  private upsert(clerkUserId: string): Promise<Applicant> {
    return this.prisma.applicant.upsert({
      where: { clerkUserId },
      create: { clerkUserId },
      update: {},
    });
  }

  private assertNotSuspended(applicant: Applicant) {
    if (applicant.suspended) {
      throw new ForbiddenException(
        'Your E-Embassy access is suspended. Please contact support.',
      );
    }
  }

  /**
   * Attaches unowned records whose email matches the caller's verified
   * WorldStreet email. Records already owned by someone are never touched, and
   * an unverified email claims nothing.
   */
  private async claimRecordsByEmail(
    clerkUserId: string,
    identity: WorldStreetIdentity,
  ): Promise<JoinResult['linked']> {
    if (!identity.email || !identity.emailVerified) {
      return { visa: 0, passport: 0, hires: 0 };
    }
    const email = { equals: identity.email, mode: 'insensitive' as const };

    const [visa, passport, hires] = await this.prisma.$transaction([
      this.prisma.visaDocumentation.updateMany({
        where: { clerkUserId: null, email },
        data: { clerkUserId },
      }),
      this.prisma.passportApplication.updateMany({
        where: { clerkUserId: null, email },
        data: { clerkUserId },
      }),
      this.prisma.hireBooking.updateMany({
        where: { clerkUserId: null, travellerEmail: email },
        data: { clerkUserId },
      }),
    ]);

    const linked = {
      visa: visa.count,
      passport: passport.count,
      hires: hires.count,
    };
    if (linked.visa || linked.passport || linked.hires) {
      this.logger.log(
        `Linked earlier records to clerkUserId=${clerkUserId}: visa=${linked.visa}, passport=${linked.passport}, hires=${linked.hires}`,
      );
    }
    return linked;
  }
}
