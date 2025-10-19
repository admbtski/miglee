// components/admin/AdminPanelLauncher.tsx
'use client';

import { useMemo, useState } from 'react';
import { AdminUser, AdminUsersModal, UsersQueryVars } from './admin-user-modal';
import { useUsersQuery } from '@/hooks/users';
import { FloatingAdminButton } from './floating-admin-button';

/** Map a single GQL user into the AdminUser shape */
function mapGqlUser(u: any): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.imageUrl,
    role: u.role,
    username: u.name,
    createdAt: u.createdAt,
    verifiedAt: u.verifiedAt,
    lastSeenAt: u.lastSeenAt,
  };
}

export function AdminPanelLauncher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  // Controlled query variables mirrored to backend
  const [vars, setVars] = useState<UsersQueryVars>({
    limit: 10,
    offset: 0,
    q: null,
    role: null,
    verifiedOnly: null,
    sort: { by: 'CREATED_AT', dir: 'DESC' },
  });

  console.dir({ vars });

  const { data, isLoading, isFetching, refetch } = useUsersQuery(
    {
      limit: vars.limit,
      offset: vars.offset,
      q: vars.q ?? undefined,
      role: vars.role,
      verifiedOnly: vars.verifiedOnly,
      sortBy: vars.sort?.by,
      sortDir: vars.sort?.dir,
    },
    { enabled: open, keepPreviousData: true }
  );

  const users: AdminUser[] = useMemo(
    () => (data?.users.items ?? []).map(mapGqlUser),
    [data]
  );

  const total = data?.users.pageInfo.total ?? 0;

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
