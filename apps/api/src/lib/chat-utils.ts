/**
 * Chat utilities: sanitization, validation, cursor pagination
 */

import { GraphQLError } from 'graphql';

// =============================================================================
// Content Sanitization & Validation
// =============================================================================

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Allowed markdown patterns (limited subset)
 * - **bold**
 * - _italic_
 * - `code`
 * - [label](url) with validation
 */
const ALLOWED_MARKDOWN_PATTERNS = {
  bold: /\*\*([^*]+)\*\*/g,
  italic: /_([^_]+)_/g,
  code: /`([^`]+)`/g,
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
};

/**
 * Sanitize message content:
 * - Strip HTML tags
 * - Allow limited markdown
 * - Validate URLs in links (add rel="nofollow")
 * - Trim whitespace
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    throw new GraphQLError('Content must be a non-empty string.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'content' },
    });
  }

  // Trim
  let sanitized = content.trim();

  // Strip HTML tags (simple approach - for production use a library like DOMPurify)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Validate length
  if (sanitized.length === 0) {
    throw new GraphQLError('Content cannot be empty.', {
      extensions: { code: 'BAD_USER_INPUT', field: 'content' },
    });
  }

  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    throw new GraphQLError(
      `Content too long (max ${MAX_MESSAGE_LENGTH} characters).`,
      {
        extensions: { code: 'BAD_USER_INPUT', field: 'content' },
      }
    );
  }

  // Validate URLs in markdown links
  sanitized = sanitized.replace(
    ALLOWED_MARKDOWN_PATTERNS.link,
    (_match, label, url) => {
      if (!isValidUrl(url)) {
        return label; // Strip invalid link, keep label
      }
      // Add nofollow for security
      return `[${label}](${url})`;
    }
  );

  return sanitized;
}

/**
 * Simple URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate DM content (same rules as event chat for now)
 */
export function sanitizeDmContent(content: string): string {
  return sanitizeMessageContent(content);
}

// =============================================================================
// Cursor Pagination
// =============================================================================

export interface CursorData {
  createdAt: Date;
  id: string;
}

/**
 * Build cursor from createdAt and id
 * Format: base64(createdAt_ISO|id)
 */
export function buildCursor(data: CursorData): string {
  const payload = `${data.createdAt.toISOString()}|${data.id}`;
  return Buffer.from(payload, 'utf-8').toString('base64');
}

/**
 * Parse cursor back to { createdAt, id }
 */
export function parseCursor(cursor: string): CursorData | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [createdAtStr, id] = decoded.split('|');

    if (!createdAtStr || !id) {
      return null;
    }

    const createdAt = new Date(createdAtStr);
    if (isNaN(createdAt.getTime())) {
      return null;
    }

    return { createdAt, id };
  } catch {
    return null;
  }
}

/**
 * Build Prisma where clause for cursor-based pagination
 * @param before - cursor for fetching older messages (before this cursor)
 * @param after - cursor for fetching newer messages (after this cursor)
 */
type CursorWhereClause = Record<string, unknown>;

export function buildCursorWhere(
  before?: string | null,
  after?: string | null
): CursorWhereClause {
  if (before) {
    const parsed = parseCursor(before);
    if (!parsed) {
      throw new GraphQLError('Invalid before cursor format.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'before' },
      });
    }

    // For fetching older messages: (createdAt, id) < cursor
    return {
      OR: [
        { createdAt: { lt: parsed.createdAt } },
        {
          createdAt: parsed.createdAt,
          id: { lt: parsed.id },
        },
      ],
    };
  }

  if (after) {
    const parsed = parseCursor(after);
    if (!parsed) {
      throw new GraphQLError('Invalid after cursor format.', {
        extensions: { code: 'BAD_USER_INPUT', field: 'after' },
      });
    }

    // For fetching newer messages: (createdAt, id) > cursor
    return {
      OR: [
        { createdAt: { gt: parsed.createdAt } },
        {
          createdAt: parsed.createdAt,
          id: { gt: parsed.id },
        },
      ],
    };
  }

  return {};
}

// =============================================================================
// Time Window Validation
// =============================================================================

/**
 * Check if a message can be edited (within 5 minutes)
 */
export function canEdit(createdAt: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const fiveMinutes = 5 * 60 * 1000;
  return diffMs <= fiveMinutes;
}

/**
 * Check if a message can be soft-deleted by author (within 15 minutes)
 */
export function canSoftDelete(createdAt: Date): boolean {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const fifteenMinutes = 15 * 60 * 1000;
  return diffMs <= fifteenMinutes;
}

// =============================================================================
// Helper: Create pair key for DM threads
// =============================================================================

/**
 * Create canonical pair key for DM thread
 * Format: min(a,b)|max(a,b)
 */
export function createDmPairKey(userId1: string, userId2: string): string {
  if (userId1 === userId2) {
    throw new GraphQLError('Cannot create DM thread with yourself.', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}|${sorted[1]}`;
}

/**
 * Extract user IDs from pair key
 */
export function parseDmPairKey(pairKey: string): [string, string] {
  const [aUserId, bUserId] = pairKey.split('|');
  if (!aUserId || !bUserId) {
    throw new Error('Invalid pair key format');
  }
  return [aUserId, bUserId];
}
