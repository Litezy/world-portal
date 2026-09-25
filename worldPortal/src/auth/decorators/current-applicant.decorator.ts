import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** The verified WorldStreet subject behind an applicant request. */
export interface ApplicantPrincipal {
  clerkUserId: string;
}

export interface RequestWithApplicant extends Request {
  applicant?: ApplicantPrincipal;
}

/** Reads the principal `ClerkAuthGuard` attached. Use only behind that guard. */
export const CurrentApplicant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApplicantPrincipal | undefined =>
    ctx.switchToHttp().getRequest<RequestWithApplicant>().applicant,
);
