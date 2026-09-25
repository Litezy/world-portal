import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { ClerkTokenVerifier } from './clerk-token.verifier';

jest.mock('@clerk/backend', () => ({ verifyToken: jest.fn() }));

const mockedVerifyToken = verifyToken as unknown as jest.Mock;

function verifierWith(env: Record<string, string | undefined>) {
  const config = {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService;
  return new ClerkTokenVerifier(config);
}

describe('ClerkTokenVerifier', () => {
  beforeEach(() => mockedVerifyToken.mockReset());

  it('refuses every token when no Clerk key is configured', async () => {
    const verifier = verifierWith({});
    expect(verifier.isConfigured()).toBe(false);
    await expect(verifier.verify('token')).rejects.toThrow(/not configured/);
    expect(mockedVerifyToken).not.toHaveBeenCalled();
  });

  it('returns the Clerk user id of a valid token', async () => {
    mockedVerifyToken.mockResolvedValue({ sub: 'user_123' });
    const verifier = verifierWith({ CLERK_SECRET_KEY: 'sk_test_x' });

    await expect(verifier.verify('good')).resolves.toEqual({
      clerkUserId: 'user_123',
    });
    expect(mockedVerifyToken).toHaveBeenCalledWith('good', {
      secretKey: 'sk_test_x',
      jwtKey: undefined,
    });
  });

  it('passes the configured authorized parties through', async () => {
    mockedVerifyToken.mockResolvedValue({ sub: 'user_123' });
    const verifier = verifierWith({
      CLERK_JWT_KEY: '-----BEGIN PUBLIC KEY-----',
      CLERK_AUTHORIZED_PARTIES:
        'https://embassy.worldstreetgold.com, http://localhost:3000',
    });

    await verifier.verify('good');
    expect(mockedVerifyToken).toHaveBeenCalledWith('good', {
      secretKey: undefined,
      jwtKey: '-----BEGIN PUBLIC KEY-----',
      authorizedParties: [
        'https://embassy.worldstreetgold.com',
        'http://localhost:3000',
      ],
    });
  });

  it('rejects a token without a subject', async () => {
    mockedVerifyToken.mockResolvedValue({ sub: '' });
    const verifier = verifierWith({ CLERK_SECRET_KEY: 'sk_test_x' });
    await expect(verifier.verify('odd')).rejects.toThrow(/subject/);
  });

  it('propagates Clerk verification failures', async () => {
    mockedVerifyToken.mockRejectedValue(new Error('JWT is expired'));
    const verifier = verifierWith({ CLERK_SECRET_KEY: 'sk_test_x' });
    await expect(verifier.verify('old')).rejects.toThrow('JWT is expired');
  });
});
