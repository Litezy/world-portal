import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isTrustedServiceKey } from '../service-key';
import { RequestWithCaller } from './service-or-desk.guard';

/**
 * For routes only our website server may call: it sends SERVICE_AUTH_KEY as
 * `x-service-key` and has already decided, from the visitor's own session,
 * whose data the call is about.
 *
 * The service-key half of `ServiceOrDeskGuard`, without the desk-token
 * fallback. Use it where a route takes a caller-chosen subject (a recipient
 * id, say) and no desk screen needs to call it directly. Everyone else,
 * including a valid desk token, gets a 401.
 */
@Injectable()
export class ServiceKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithCaller>();
    const sentKey = request.headers['x-service-key'];
    const expected = this.configService.get<string>('SERVICE_AUTH_KEY');

    if (
      typeof sentKey !== 'string' ||
      !isTrustedServiceKey(expected, sentKey)
    ) {
      throw new UnauthorizedException(
        'This route only answers the E-Embassy website server',
      );
    }
    request.serviceCaller = true;
    return true;
  }
}
