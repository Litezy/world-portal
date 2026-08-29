import { Logger } from '@nestjs/common';
import { PrismaClient, UserRole } from '@prisma/client';

const logger = new Logger('PrismaSeed');
const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEFAULT_MANAGER_EMAIL || 'manager@loveworld.com';
  const externalAuthId =
    process.env.DEFAULT_MANAGER_EXTERNAL_AUTH_ID || 'external-auth-manager-001';

  logger.log(`Seeding database with default manager profile (email=${email})...`);

  const defaultManager = await prisma.profile.upsert({
    where: { email },
    update: {},
    create: {
      email,
      firstName: 'System',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      externalAuthId,
      isActive: true,
    },
  });

  logger.log(
    `Default Manager Profile Seeded successfully: id=${defaultManager.id}, email=${defaultManager.email}, role=${defaultManager.role}, externalAuthId=${defaultManager.externalAuthId}`,
  );
}

main()
  .catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : 'Unknown seeding error';
    logger.error(`Error during database seed: ${msg}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
