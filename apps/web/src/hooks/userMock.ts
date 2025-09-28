const loggedIn = true;

const loggedInUserMock = {
  username: 'admin',
  email: 'admin@admin.com',
  password: 'password123#',
};

const notLoggedUserMock = null;

export const userMock = loggedIn ? loggedInUserMock : notLoggedUserMock;

export type User = typeof loggedInUserMock | typeof notLoggedUserMock;
