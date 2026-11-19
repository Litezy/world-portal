/** Values that have been published (in .env.example) and so sign nothing safely. */
const PUBLISHED_SECRETS = new Set(['world-portal-secret-key-2026']);

/**
 * The secret desk tokens are signed and checked with. ExternalAuthGuard
 * verifies every token against it, so in production an empty, short or
 * published secret would let anyone sign a manager token: refuse to start.
 */
export function resolveJwtSecret(env: NodeJS.ProcessEnv): string {
  const secret = env.JWT_SECRET ?? '';
  if (env.NODE_ENV === 'production') {
    if (secret.length < 32 || PUBLISHED_SECRETS.has(secret)) {
      throw new Error(
        'JWT_SECRET must be a private random value of at least 32 characters in production.',
      );
    }
  }
  return secret;
}
