import type { AuthSession, Role, SessionUser } from "./types";
import { permissionsFor } from "./permissions";
import { db } from "../mock/db";

const STORAGE_KEY = "ebb_session";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function encodeToken(payload: unknown): string {
  // Mock JWT shape: header.payload.signature (base64url). Not a real signed token.
  const header = btoa(JSON.stringify({ alg: "mock", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthSession> {
  await delay(350);
  const user = db.findUserByEmail(email);
  // In mock mode any non-empty password works for seeded users.
  if (!user || !password) {
    throw new Error("Invalid email or password");
  }
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    permissions: permissionsFor(user.role as Role),
    avatarInitials: initials(user.name),
  };
  const now = Date.now();
  const session: AuthSession = {
    token: encodeToken({ sub: sessionUser.id, role: sessionUser.role }),
    user: sessionUser,
    issuedAt: now,
    expiresAt: now + 1000 * 60 * 60 * 8,
  };
  persist(session);
  return session;
}

export async function signUp(
  name: string,
  email: string,
  _password: string,
): Promise<{ pending: true; message: string }> {
  await delay(450);
  // Customer self-signup: creates a customer account in a pending state.
  // In the real flow, bank admin approves. In mock mode we auto-create.
  db.addUser({
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    name,
    email,
    role: "customer",
    status: "active",
    createdAt: new Date().toISOString(),
  });
  return {
    pending: true,
    message:
      "Account created. A Bank Admin will review your signup. You can sign in once approved.",
  };
}

export function signOut(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function persist(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
