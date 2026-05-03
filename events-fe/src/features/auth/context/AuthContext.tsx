import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../api/authApi';
import { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isUnauthorized(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didInitializeRef = useRef(false);

  const refreshUser = async () => {
    try {
      await authApi.fetchCsrfToken();
      const currentUser = await authApi.me();
      setUser(currentUser);
    } catch (error) {
      if (!isUnauthorized(error)) {
        throw error;
      }
      setUser(null);
    }
  };

  useEffect(() => {
    if (didInitializeRef.current) {
      return;
    }

    didInitializeRef.current = true;
    void (async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isLoading,
      login: async (payload) => {
        await authApi.fetchCsrfToken();
        const loggedInUser = await authApi.login(payload);
        setUser(loggedInUser);
        return loggedInUser;
      },
      register: async (payload) => {
        await authApi.fetchCsrfToken();
        const registeredUser = await authApi.register(payload);
        await authApi.fetchCsrfToken();
        const loggedInUser = await authApi.login({
          email: payload.email,
          password: payload.password,
        });
        setUser(loggedInUser);
        return registeredUser;
      },
      logout: async () => {
        try {
          await authApi.fetchCsrfToken();
          await authApi.logout();
        } catch (error) {
          if (!isUnauthorized(error)) {
            throw error;
          }
        }
        setUser(null);
      },
      refreshUser,
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth mora da se koristi unutar AuthProvider komponente.');
  }

  return context;
}
