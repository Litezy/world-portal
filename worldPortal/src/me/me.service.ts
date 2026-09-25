import { Injectable, NotFoundException } from '@nestjs/common';
import { VisaDocumentationService } from '../visa-documentation/visa-documentation.service';
import { PassportApplicationService } from '../passport-application/passport-application.service';
import { HireService } from '../hire/hire.service';

type Tagged<T, K extends 'VISA' | 'PASSPORT'> = T & { type: K };

/**
 * Read models for the signed-in applicant. Every query here is scoped to the
 * caller's Clerk user id — there is no way to ask for someone else's records.
 */
@Injectable()
export class MeService {
  constructor(
    private readonly visa: VisaDocumentationService,
    private readonly passport: PassportApplicationService,
    private readonly hire: HireService,
  ) {}

  /** Visa and passport applications together, newest first, tagged by type. */
  async listApplications(clerkUserId: string) {
    const [visa, passport] = await Promise.all([
      this.visa.findVisaApplicationsByClerkUser(clerkUserId),
      this.passport.findPassportApplicationsByClerkUser(clerkUserId),
    ]);

    return [
      ...visa.map((doc) => ({ ...doc, type: 'VISA' as const })),
      ...passport.map((doc) => ({ ...doc, type: 'PASSPORT' as const })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Array<
      | Tagged<(typeof visa)[number], 'VISA'>
      | Tagged<(typeof passport)[number], 'PASSPORT'>
    >;
  }

  /** One of the caller's applications, by application number or id. */
  async getApplication(clerkUserId: string, reference: string) {
    const wanted = reference.trim().toUpperCase();
    const all = await this.listApplications(clerkUserId);
    const match = all.find(
      (app) =>
        app.applicationNo.toUpperCase() === wanted ||
        app.id.toUpperCase() === wanted,
    );
    if (!match) {
      throw new NotFoundException(
        `No application '${reference}' was found on your account.`,
      );
    }
    return match;
  }

  listHires(clerkUserId: string) {
    return this.hire.findBookingsByClerkUser(clerkUserId);
  }
}
