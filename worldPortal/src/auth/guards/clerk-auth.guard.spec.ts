import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkTokenVerifier } from '../clerk/clerk-token.verifier';
import { RequestWithApplicant } from '../decorators/current-applicant.decorator';

function contextFor(request: Partial<RequestWithApplicant>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ClerkAuthGuard', () => {
  const verify = jest.fn();
  const guard = new ClerkAuthGuard({ verify } as unknown as ClerkTokenVerifier);

  beforeEach(() => verify.mockReset());

  it('rejects a request with no Authorization header', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer Authorization header', async () => {
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Basic abc' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a token the verifier refuses', async () => {
    verify.mockRejectedValue(new Error('bad signature'));
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer forged' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the verified applicant to the request', async () => {
    verify.mockResolvedValue({ clerkUserId: 'user_123' });
    const request: Partial<RequestWithApplicant> = {
      headers: { authorization: 'Bearer good' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('good');
    expect(request.applicant).toEqual({ clerkUserId: 'user_123' });
  });
});
