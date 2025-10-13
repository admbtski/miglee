import { Role } from '@prisma/client';

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
}

const user: SessionUser = {
  id: 'u_user_00000000000000000001',
  name: 'User Fixed',
  role: Role.USER,
};

const moderator: SessionUser = {
  id: 'u_moderator_00000000000000000001',
  name: 'Moderator One',
  role: Role.MODERATOR,
};

const admin: SessionUser = {
  id: 'u_admin_00000000000000000001',
  name: 'admin',
  role: Role.ADMIN,
};

export const userMock = {
  user,
  admin,
  moderator,
  _empty: null,
} as const;
