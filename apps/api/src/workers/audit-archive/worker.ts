// IMPORTANT: Must be first import to initialize OTel SDK
import '../instrumentation';
import { logger } from '../logger';
import { bootstrapAuditArchiveWorker } from './queue';

try {
  bootstrapAuditArchiveWorker();
  logger.info('🎯 Audit archive worker bootstrap complete.');
} catch (err) {
  logger.error({ err }, '[audit-archive-worker] Startup failed.');
  process.exit(1);
}

