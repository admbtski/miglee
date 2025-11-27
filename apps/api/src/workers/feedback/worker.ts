import { logger } from '../logger';
import { bootstrapFeedbackWorker } from './queue';

try {
  bootstrapFeedbackWorker();
  logger.info('🎯 Feedback worker bootstrap complete.');
} catch (err) {
  logger.error({ err }, '[feedback-worker] Startup failed.');
  process.exit(1);
}
