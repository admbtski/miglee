import type { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '../../../lib/prisma';
import { resolverWithMetrics } from '../../../lib/resolver-metrics';
import type { QueryResolvers } from '../../__generated__/resolvers-types';
import { mapReport } from '../helpers';

const REPORT_INCLUDE = {
  reporter: true,
} satisfies Prisma.ReportInclude;

/**
 * Query: Get all reports (admin only)
 */
export const reportsQuery: QueryResolvers['reports'] = resolverWithMetrics(
  'Query',
  'reports',
  async (_p, args, { user }) => {
    // Admin only
    if (!user?.id || user.role !== Role.ADMIN) {
      throw new GraphQLError('Admin access required.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const { limit, offset, status, entity } = args;

    const take = Math.max(1, Math.min(limit ?? 20, 100));
    const skip = Math.max(0, offset ?? 0);

    const where: Prisma.ReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (entity) {
      where.entity = entity as any;
    }

    const total = await prisma.report.count({ where });

    const reports = await prisma.report.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: REPORT_INCLUDE,
    });

    return {
      items: reports.map((r) => mapReport(r as any)),
      pageInfo: {
        total,
        limit: take,
        offset: skip,
        hasPrev: skip > 0,
        hasNext: skip + take < total,
      },
    };
  }
);

/**
 * Query: Get a single report (admin only)
 */
export const reportQuery: QueryResolvers['report'] = resolverWithMetrics(
  'Query',
  'report',
  async (_p, { id }, { user }) => {
    // Admin only
    if (!user?.id || user.role !== Role.ADMIN) {
      throw new GraphQLError('Admin access required.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: REPORT_INCLUDE,
    });

    if (!report) {
      return null;
    }

    return mapReport(report as any);
  }
);
