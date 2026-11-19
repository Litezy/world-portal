import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerLimitDetail,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import { Response } from 'express';
import { ClientIdentity, ThrottledRequest } from './client-identity';

/**
 * The global rate limiter: `@nestjs/throttler`'s guard, told who each request
 * counts against by ClientIdentity. A 429 is thrown as an HttpException, so
 * AllExceptionsFilter renders it in the API's usual error shape.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    private readonly identity: ClientIdentity,
  ) {
    super(options, storage, reflector);
  }

  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ThrottledRequest>();
    return Promise.resolve(this.identity.isUnlimitedServiceCall(req));
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    return this.identity.trackerFor(req as ThrottledRequest);
  }

  /**
   * Named throttlers suffix their headers (`Retry-After-route`), which no
   * client looks for, so every 429 also carries the standard Retry-After.
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    context
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Retry-After', String(detail.timeToBlockExpire));
    await super.throwThrottlingException(context, detail);
  }
}
