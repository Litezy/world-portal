import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ClerkTokenVerifier } from '../clerk/clerk-token.verifier';
import { RequestWithApplicant } from '../decorators/current-applicant.decorator';

/**
 * Admits a request only when it carries a valid WorldStreet session token.
 *
 * This is the applicant-side guard. The admin console still uses
 * `ExternalAuthGuard` with its own tokens; the two are never combined on one
 * route.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly verifier: ClerkTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithApplicant>();
    const header = request.headers['authorization'];

    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Sign in with your WorldStreet account to continue',
      );
    }

    try {
      request.applicant = await this.verifier.verify(header.slice(7).trim());
      return true;
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(`WorldStreet session rejected: ${reason}`);
      throw new UnauthorizedException(
        'Your WorldStreet session is invalid or has expired. Please sign in again.',
      );
    }
  }
}
