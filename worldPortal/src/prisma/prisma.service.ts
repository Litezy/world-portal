import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL database via Prisma...');
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        await this.$connect();
        this.logger.log(
          'PostgreSQL database connection established successfully.',
        );
        return;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : 'Unknown connection error';
        this.logger.warn(
          `Database connection attempt ${attempts}/${maxAttempts} failed: ${msg}`,
        );
        if (attempts >= maxAttempts) {
          this.logger.error(
            'Exhausted maximum PostgreSQL database connection retries.',
          );
          throw error;
        }
        // Delay before retrying cold-booted serverless database connection
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from PostgreSQL database...');
    await this.$disconnect();
  }
}
