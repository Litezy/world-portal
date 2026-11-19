import { ConflictException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const ATTEMPTS = 3;

/**
 * Runs `work` in one SERIALIZABLE transaction, so two desk actions on the same
 * money or the same team can't both pass a check only one of them should: a
 * double-clicked refund, two payments recorded against one balance, two
 * managers removing each other.
 *
 * Postgres aborts the losing transaction with a serialization failure (Prisma
 * `P2034`). It is retried with fresh reads, which then see the winner's change
 * and refuse properly; a third clash in a row becomes a 409.
 *
 * `work` may run more than once, so keep emails and other side effects out of
 * it and send them after this resolves.
 */
export async function serializable<T>(
  prisma: Pick<PrismaClient, '$transaction'>,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (!isSerializationFailure(error)) throw error;
      if (attempt >= ATTEMPTS) {
        throw new ConflictException(
          'Someone else changed this at the same moment. Reload and try again.',
        );
      }
    }
  }
}

function isSerializationFailure(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}
