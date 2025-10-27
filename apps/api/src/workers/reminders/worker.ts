import { logger } from '../logger';
import { bootstrapRemindersWorker } from './queue';

try {
  bootstrapRemindersWorker();
  logger.info('🎯 Reminder worker bootstrap complete.');
} catch (err) {
  logger.error({ err }, '[worker] Startup failed.');
  process.exit(1);
}
