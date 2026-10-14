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
import { getSession, startSignIn, verifyMfa as mockVerify, resendMfa, signOut as mockSignOut, signUp as mockSignUp, type MfaChallenge } from "./mock-auth";
import { can as canFn, canAny as canAnyFn } from "./permissions";

interface AuthContextValue {
  session: AuthSession | null;
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  startSignIn: (email: string, password: string) => Promise<MfaChallenge>;
  verifyMfa: (challengeId: string, code: string) => Promise<{ done: true; session: AuthSession } | { done: false; challenge: MfaChallenge }>;
  resendMfa: (challengeId: string) => Promise<MfaChallenge>;
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

  const verifyMfa = useCallback(async (challengeId: string, code: string) => {
    const res = await mockVerify(challengeId, code);
    if (res.done) setSession(res.session);
    return res;
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
