import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApplicantService } from './applicant.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClerkIdentityService,
  WorldStreetIdentity,
} from '../auth/clerk/clerk-identity.service';

const verified: WorldStreetIdentity = {
  clerkUserId: 'user_123',
  email: 'ada@example.com',
  emailVerified: true,
  firstName: 'Ada',
  lastName: 'Obi',
};

function setup(identity: WorldStreetIdentity | null, suspended = false) {
  const applicantRow = {
    id: 'app-1',
    clerkUserId: 'user_123',
    joinedAt: new Date(),
    suspended,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    applicant: {
      upsert: jest.fn().mockResolvedValue(applicantRow),
      findUnique: jest.fn().mockResolvedValue(applicantRow),
    },
    visaDocumentation: { updateMany: jest.fn().mockReturnValue('visa-op') },
    passportApplication: {
      updateMany: jest.fn().mockReturnValue('passport-op'),
    },
    hireBooking: { updateMany: jest.fn().mockReturnValue('hire-op') },
    $transaction: jest
      .fn()
      .mockResolvedValue([{ count: 2 }, { count: 1 }, { count: 0 }]),
  };
  const identities = { getIdentity: jest.fn().mockResolvedValue(identity) };
  const service = new ApplicantService(
    prisma as unknown as PrismaService,
    identities as unknown as ClerkIdentityService,
  );
  return { service, prisma, identities };
}

describe('ApplicantService', () => {
  describe('join', () => {
    it('upserts the applicant keyed by Clerk user id, so joining twice is harmless', async () => {
      const { service, prisma } = setup(verified);

      await service.join('user_123');
      await service.join('user_123');

      expect(prisma.applicant.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.applicant.upsert).toHaveBeenCalledWith({
        where: { clerkUserId: 'user_123' },
        create: { clerkUserId: 'user_123' },
        update: {},
      });
    });

    it('claims only unowned records matching the verified email', async () => {
      const { service, prisma } = setup(verified);

      const result = await service.join('user_123');

      const email = { equals: 'ada@example.com', mode: 'insensitive' };
      expect(prisma.visaDocumentation.updateMany).toHaveBeenCalledWith({
        where: { clerkUserId: null, email },
        data: { clerkUserId: 'user_123' },
      });
      expect(prisma.hireBooking.updateMany).toHaveBeenCalledWith({
        where: { clerkUserId: null, travellerEmail: email },
        data: { clerkUserId: 'user_123' },
      });
      expect(result.linked).toEqual({ visa: 2, passport: 1, hires: 0 });
    });

    it('claims nothing when the WorldStreet email is not verified', async () => {
      const { service, prisma } = setup({ ...verified, emailVerified: false });

      const result = await service.join('user_123');

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(result.linked).toEqual({ visa: 0, passport: 0, hires: 0 });
    });

    it('refuses a suspended applicant', async () => {
      const { service } = setup(verified, true);
      await expect(service.join('user_123')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('treats a user Clerk does not know as a deployment fault', async () => {
      const { service } = setup(null);
      await expect(service.join('user_123')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('requireActiveApplicant', () => {
    it('returns the owner with the verified email', async () => {
      const { service } = setup(verified);
      await expect(service.requireActiveApplicant('user_123')).resolves.toEqual(
        { clerkUserId: 'user_123', email: 'ada@example.com' },
      );
    });

    it('refuses an account without a verified email', async () => {
      const { service } = setup({ ...verified, emailVerified: false });
      await expect(
        service.requireActiveApplicant('user_123'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses a suspended applicant', async () => {
      const { service } = setup(verified, true);
      await expect(
        service.requireActiveApplicant('user_123'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
