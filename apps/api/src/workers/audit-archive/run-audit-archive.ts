import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { gzipSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { prisma } from '../../lib/prisma';
import { config } from '../../env';
import { logger } from '../logger';

/**
 * Get S3 client for audit archive storage
 * Returns null if S3 is not configured
 */
function getS3Client(): S3Client | null {
  if (!config.s3Bucket || !config.s3Region) {
    return null;
  }

  return new S3Client({
    region: config.s3Region,
    endpoint: config.s3Endpoint,
    credentials:
      config.s3AccessKeyId && config.s3SecretAccessKey
        ? {
            accessKeyId: config.s3AccessKeyId,
            secretAccessKey: config.s3SecretAccessKey,
          }
        : undefined,
  });
}

/**
 * Upload audit archive to S3
 * @param eventId - Event ID
 * @param data - Archive data as JSONL string
 * @returns S3 key if successful, null if S3 not configured
 */
async function uploadToS3(
  eventId: string,
  data: string
): Promise<string | null> {
  const s3Client = getS3Client();

  if (!s3Client || !config.s3Bucket) {
    logger.warn(
      { eventId },
      '[uploadToS3] S3 not configured, skipping upload.'
    );
    return null;
  }

  const key = `audit-archives/${eventId}.jsonl.gz`;
  const compressedData = gzipSync(Buffer.from(data, 'utf-8'));

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: compressedData,
      ContentType: 'application/gzip',
      ContentEncoding: 'gzip',
      Metadata: {
        eventId,
        archivedAt: new Date().toISOString(),
        originalSizeBytes: String(data.length),
        compressedSizeBytes: String(compressedData.length),
      },
    })
  );

  logger.info(
    {
      eventId,
      key,
      originalSize: data.length,
      compressedSize: compressedData.length,
      compressionRatio:
        ((1 - compressedData.length / data.length) * 100).toFixed(1) + '%',
    },
    '[uploadToS3] Archive uploaded successfully.'
  );

  return key;
}

/**
 * Save audit archive to local filesystem
 * @param eventId - Event ID
 * @param data - Archive data as JSONL string
 * @returns Local file path if successful
 */
async function saveToLocal(eventId: string, data: string): Promise<string> {
  const filename = `${eventId}.jsonl.gz`;
  const filePath = join(config.auditArchivePath, filename);

  // Ensure directory exists
  await mkdir(dirname(filePath), { recursive: true });

  // Compress and write file
  const compressedData = gzipSync(Buffer.from(data, 'utf-8'));
  await writeFile(filePath, compressedData);

  logger.info(
    {
      eventId,
      filePath,
      originalSize: data.length,
      compressedSize: compressedData.length,
      compressionRatio:
        ((1 - compressedData.length / data.length) * 100).toFixed(1) + '%',
    },
    '[saveToLocal] Archive saved to local filesystem.'
  );

  return filePath;
}

/**
 * Convert audit logs to JSONL format (one JSON object per line)
 */
function toJsonl(logs: unknown[]): string {
  return logs.map((log) => JSON.stringify(log)).join('\n');
}

/**
 * Archive and delete audit logs for an event
 *
 * This function:
 * 1. Fetches all audit logs for the event
 * 2. Exports them to S3 (if MEDIA_STORAGE_PROVIDER=S3) or local disk (if LOCAL)
 * 3. Deletes the audit logs from the database
 * 4. Marks the event as archived (auditArchivedAt)
 *
 * @param eventId - Event ID to archive audit logs for
 */
export async function runAuditLogArchive(eventId: string): Promise<void> {
  const startTime = Date.now();

  logger.info({ eventId }, '[runAuditLogArchive] Starting audit archive...');

  try {
    // 1. Fetch event to check if it exists and is eligible for archiving
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        endAt: true,
        auditArchivedAt: true,
        deletedAt: true,
      },
    });

    if (!event) {
      logger.warn(
        { eventId },
        '[runAuditLogArchive] Event not found, skipping.'
      );
      return;
    }

    // Check if already archived
    if (event.auditArchivedAt) {
      logger.info(
        { eventId, auditArchivedAt: event.auditArchivedAt },
        '[runAuditLogArchive] Event already archived, skipping.'
      );
      return;
    }

    // 2. Count audit logs
    const auditLogCount = await prisma.eventAuditLog.count({
      where: { eventId },
    });

    if (auditLogCount === 0) {
      logger.info(
        { eventId },
        '[runAuditLogArchive] No audit logs found, marking as archived.'
      );

      // Mark event as archived even with no logs
      await prisma.event.update({
        where: { id: eventId },
        data: { auditArchivedAt: new Date() },
      });

      return;
    }

    logger.info(
      { eventId, auditLogCount },
      '[runAuditLogArchive] Found audit logs to archive.'
    );

    // 3. Fetch all audit logs for export (in batches for large datasets)
    const BATCH_SIZE = 1000;
    let offset = 0;
    const allLogs: unknown[] = [];

    while (true) {
      const batch = await prisma.eventAuditLog.findMany({
        where: { eventId },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: BATCH_SIZE,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (batch.length === 0) {
        break;
      }

      // Transform batch for archive format
      const transformedBatch = batch.map((log) => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        scope: log.scope,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        actorId: log.actorId,
        actorName: log.actor?.name || null,
        actorRole: log.actorRole,
        severity: log.severity,
        diff: log.diff,
        meta: log.meta,
      }));

      allLogs.push(...transformedBatch);
      offset += BATCH_SIZE;

      if (batch.length < BATCH_SIZE) {
        break;
      }
    }

    logger.info(
      { eventId, totalLogs: allLogs.length },
      '[runAuditLogArchive] Fetched all audit logs.'
    );

    // 4. Export to storage (S3 or LOCAL based on config)
    const jsonlData = toJsonl(allLogs);
    let archiveLocation: string | null = null;

    try {
      if (config.mediaStorageProvider === 'S3') {
        // Try S3 first
        archiveLocation = await uploadToS3(eventId, jsonlData);

        // Fallback to local if S3 upload returns null (not configured)
        if (!archiveLocation) {
          logger.info(
            { eventId },
            '[runAuditLogArchive] S3 not available, falling back to local storage.'
          );
          archiveLocation = await saveToLocal(eventId, jsonlData);
        }
      } else {
        // LOCAL storage
        archiveLocation = await saveToLocal(eventId, jsonlData);
      }
    } catch (uploadError) {
      logger.error(
        { err: uploadError, eventId },
        '[runAuditLogArchive] Failed to save archive, attempting fallback...'
      );

      // If S3 fails, try local as fallback
      if (config.mediaStorageProvider === 'S3') {
        try {
          archiveLocation = await saveToLocal(eventId, jsonlData);
          logger.info(
            { eventId, archiveLocation },
            '[runAuditLogArchive] Saved to local storage as fallback.'
          );
        } catch (localError) {
          logger.error(
            { err: localError, eventId },
            '[runAuditLogArchive] Local fallback also failed, aborting archive.'
          );
          throw localError;
        }
      } else {
        throw uploadError;
      }
    }

    // 5. Delete audit logs from database
    const deleteResult = await prisma.eventAuditLog.deleteMany({
      where: { eventId },
    });

    logger.info(
      { eventId, deletedCount: deleteResult.count },
      '[runAuditLogArchive] Audit logs deleted from database.'
    );

    // 6. Mark event as archived
    await prisma.event.update({
      where: { id: eventId },
      data: { auditArchivedAt: new Date() },
    });

    const duration = Date.now() - startTime;
    logger.info(
      {
        eventId,
        logCount: allLogs.length,
        archiveLocation,
        storageProvider: config.mediaStorageProvider,
        durationMs: duration,
      },
      '[runAuditLogArchive] Audit archive completed successfully.'
    );
  } catch (error) {
    logger.error(
      { err: error, eventId },
      '[runAuditLogArchive] Failed to archive audit logs.'
    );
    throw error;
  }
}
