import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

class DatabaseClient {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['info', 'warn', 'error'],
      });

      DatabaseClient.instance.$connect()
        .then(() => {
          logger.info('Database connected successfully');
        })
        .catch((error) => {
          logger.error('Database connection failed:', error);
          process.exit(1);
        });
    }

    return DatabaseClient.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      logger.info('Database disconnected');
    }
  }
}

export const prisma = DatabaseClient.getInstance();

// Graceful shutdown
process.on('beforeExit', async () => {
  await DatabaseClient.disconnect();
});

process.on('SIGINT', async () => {
  await DatabaseClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await DatabaseClient.disconnect();
  process.exit(0);
});
