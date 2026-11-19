import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { serializable } from './serializable';

const clash = () =>
  new Prisma.PrismaClientKnownRequestError(
    'Transaction failed due to a write conflict or a deadlock. Please retry your transaction',
    { code: 'P2034', clientVersion: 'test' },
  );

/** A client whose transactions run `work` against `tx`, failing the first `fails` with a clash. */
function clientFailing(fails: number) {
  let calls = 0;
  const $transaction = jest.fn((work: (tx: unknown) => Promise<unknown>) => {
    calls += 1;
    if (calls <= fails) return Promise.reject(clash());
    return work('the-tx-client');
  });
  return { $transaction } as unknown as Parameters<typeof serializable>[0] & {
    $transaction: jest.Mock;
  };
}

describe('serializable', () => {
  it('runs the work at SERIALIZABLE isolation', async () => {
    const client = clientFailing(0);

    await expect(
      serializable(client, (tx) => Promise.resolve(tx)),
    ).resolves.toBe('the-tx-client');
    expect(client.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('retries when a concurrent change wins the race', async () => {
    const client = clientFailing(2);

    await expect(
      serializable(client, () => Promise.resolve('done')),
    ).resolves.toBe('done');
    expect(client.$transaction).toHaveBeenCalledTimes(3);
  });

  it('gives up with a 409 after three clashes in a row', async () => {
    const client = clientFailing(3);

    await expect(
      serializable(client, () => Promise.resolve('never')),
    ).rejects.toThrow(ConflictException);
    expect(client.$transaction).toHaveBeenCalledTimes(3);
  });

  it('passes other errors straight through, without retrying', async () => {
    const client = clientFailing(0);

    await expect(
      serializable(client, () => Promise.reject(new NotFoundException('gone'))),
    ).rejects.toThrow(NotFoundException);
    expect(client.$transaction).toHaveBeenCalledTimes(1);
  });
});
