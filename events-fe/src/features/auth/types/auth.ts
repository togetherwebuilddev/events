export type AuthRole = 'ADMIN' | 'USER';

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: AuthRole;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};
