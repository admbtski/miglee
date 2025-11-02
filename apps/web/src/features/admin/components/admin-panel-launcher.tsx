// components/admin/AdminPanelLauncher.tsx
'use client';

import { useUsersQuery } from '@/lib/api/users';
import {
  SortDir,
  UsersSortBy,
} from '@/lib/api/__generated__/react-query-update';
import { useState } from 'react';
import { AdminUsersModal, UsersQueryVars } from './admin-user-modal';
import { FloatingAdminButton } from './floating-admin-button';

export function AdminPanelLauncher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  const [vars, setVars] = useState<UsersQueryVars>({
    limit: 10,
    offset: 0,
    q: null,
    role: null,
    verifiedOnly: null,
    sort: { by: UsersSortBy.CreatedAt, dir: SortDir.Desc },
  });

  const { data, isLoading, isFetching, refetch } = useUsersQuery(
    {
      limit: vars.limit,
      offset: vars.offset,
      q: vars.q,
      role: vars.role,
      verifiedOnly: vars.verifiedOnly,
      sortBy: vars.sort?.by,
      sortDir: vars.sort?.dir,
    },
    { enabled: open }
  );

  const total = data?.users.pageInfo.total ?? 0;
  const users = data?.users.items ?? [];

  return (
    <>
      <FloatingAdminButton
        onClick={() => setOpen(true)}
        className={className}
      />

      <AdminUsersModal
        open={open}
        onClose={() => setOpen(false)}
        users={users}
        loading={isLoading || isFetching}
        onRefresh={() => void refetch()}
        total={total}
        query={vars}
        onChangeQuery={(next) => {
          const resetOffset =
            (typeof next.q !== 'undefined' && next.q !== vars.q) ||
            (typeof next.role !== 'undefined' && next.role !== vars.role) ||
            (typeof next.verifiedOnly !== 'undefined' &&
              next.verifiedOnly !== vars.verifiedOnly) ||
            (next.sort &&
              (next.sort.by !== vars.sort?.by ||
                next.sort.dir !== vars.sort?.dir)) ||
            (typeof next.limit === 'number' && next.limit !== vars.limit);

          setVars((prev) => ({
            ...prev,
            ...next,
            offset: resetOffset ? 0 : (next.offset ?? prev.offset),
          }));
        }}
      />
    </>
  );
}
