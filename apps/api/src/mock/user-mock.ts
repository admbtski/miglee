export interface SessionUser {
  id: string;
  username: string;
  role: string;
}

const user: SessionUser = {
  id: 'user-id',
  username: 'username',
  role: 'user',
};

const admin: SessionUser = {
  id: 'admin-id',
  username: 'admin',
  role: 'admin',
};

const moderator: SessionUser = {
  id: 'moderator-id',
  username: 'moderator',
  role: 'moderator',
};

export const userMock = {
  user,
  admin,
  moderator,
  _empty: null,
} as const;
