"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
class DatabaseClient {
    static getInstance() {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['info', 'warn', 'error'],
            });
            DatabaseClient.instance.$connect()
                .then(() => {
                logger_1.logger.info('Database connected successfully');
            })
                .catch((error) => {
                logger_1.logger.error('Database connection failed:', error);
                process.exit(1);
            });
        }
        return DatabaseClient.instance;
    }
    static async disconnect() {
        if (DatabaseClient.instance) {
            await DatabaseClient.instance.$disconnect();
            logger_1.logger.info('Database disconnected');
        }
    }
}
exports.prisma = DatabaseClient.getInstance();
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
//# sourceMappingURL=database.js.map