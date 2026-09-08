import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSession, Permission, SessionUser } from "./types";
import { getSession, signIn as mockSignIn, signOut as mockSignOut, signUp as mockSignUp } from "./mock-auth";
import { can as canFn, canAny as canAnyFn } from "./permissions";

interface AuthContextValue {
  session: AuthSession | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ pending: true; message: string }>;
  signOut: () => void;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await mockSignIn(email, password);
    setSession(next);
    return next;
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      return mockSignUp(name, email, password);
    },
    [],
  );

  const signOut = useCallback(() => {
    mockSignOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      isAuthenticated: !!session,
      isLoading,
      signIn,
      signUp,
      signOut,
      can: (p) => canFn(user, p),
      canAny: (ps) => canAnyFn(user, ps),
    };
  }, [session, isLoading, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
