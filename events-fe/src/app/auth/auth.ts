export type AppRole = 'admin' | 'user';

const ROLE_STORAGE_KEY = 'events_role';

export function getCurrentRole(): AppRole {
  if (typeof window === 'undefined') {
    return 'admin';
  }

  const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
  return storedRole === 'user' ? 'user' : 'admin';
}

export function isAdminRole(role: AppRole) {
  return role === 'admin';
}
