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

export type MfaMethod = "email_otp" | "totp";

export interface MfaChallenge {
  id: string;
  email: string;
  role: Role;
  /** Current factor to verify. */
  method: MfaMethod;
  step: number;
  totalSteps: number;
  expiresAt: number;
  attemptsLeft: number;
  /** Mock only: the code is displayed so the demo can be completed. */
  demoCode: string;
  maskedDestination: string;
}

interface ChallengeState extends MfaChallenge {
  userId: string;
  code: string;
  remaining: MfaMethod[];
}

/** Admin roles need two factors, shorter codes life, fewer attempts and shorter sessions. */
export const MFA_POLICY: Record<
  Role,
  { factors: MfaMethod[]; codeTtlMs: number; attempts: number; sessionMs: number }
> = {
  customer: { factors: ["email_otp"], codeTtlMs: 5 * 60_000, attempts: 5, sessionMs: 8 * 3600_000 },
  bank_admin: {
    factors: ["totp", "email_otp"],
    codeTtlMs: 2 * 60_000,
    attempts: 3,
    sessionMs: 2 * 3600_000,
  },
  system_admin: {
    factors: ["totp", "email_otp"],
    codeTtlMs: 2 * 60_000,
    attempts: 3,
    sessionMs: 2 * 3600_000,
  },
};

const challenges = new Map<string, ChallengeState>();
const lockedUntil = new Map<string, number>();

function newCode() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0]! % 1_000_000).padStart(6, "0");
}

function maskEmail(e: string) {
  const [u, d] = e.split("@");
  return `${u?.[0] ?? ""}•••@${d ?? ""}`;
}

function publicChallenge(c: ChallengeState): MfaChallenge {
  const { userId: _u, code: _c, remaining: _r, ...pub } = c;
  return pub;
}

function issueFactor(
  c: Omit<ChallengeState, "method" | "code" | "demoCode" | "expiresAt" | "maskedDestination">,
  method: MfaMethod,
): ChallengeState {
  const code = newCode();
  return {
    ...c,
    method,
    code,
    demoCode: code,
    expiresAt: Date.now() + MFA_POLICY[c.role].codeTtlMs,
    maskedDestination: method === "totp" ? "your authenticator app" : maskEmail(c.email),
  };
}

/** Step 1: password check. Always returns an MFA challenge — no session yet. */
export async function startSignIn(email: string, password: string): Promise<MfaChallenge> {
  await delay(350);
  const user = db.findUserByEmail(email);
  const lock = lockedUntil.get(email.toLowerCase());
  if (lock && lock > Date.now()) {
    throw new Error(
      `Too many failed codes. Try again in ${Math.ceil((lock - Date.now()) / 60000)} min.`,
    );
  }
  // In mock mode any non-empty password works for seeded users.
  if (!user || !password) throw new Error("Invalid email or password");
  if (user.status === "suspended") throw new Error("This account is suspended.");
  const role = user.role as Role;
  const policy = MFA_POLICY[role];
  const [first, ...rest] = policy.factors;
  const c = issueFactor(
    {
      id: crypto.randomUUID(),
      userId: user.id,
      email: user.email,
      role,
      step: 1,
      totalSteps: policy.factors.length,
      attemptsLeft: policy.attempts,
      remaining: rest,
    },
    first!,
  );
  challenges.set(c.id, c);
  return publicChallenge(c);
}

/** Step 2+: verify the current factor. Returns the next challenge, or a session when complete. */
export async function verifyMfa(
  challengeId: string,
  code: string,
): Promise<{ done: true; session: AuthSession } | { done: false; challenge: MfaChallenge }> {
  await delay(300);
  const c = challenges.get(challengeId);
  if (!c) throw new Error("Verification expired. Please sign in again.");
  if (c.expiresAt < Date.now()) {
    challenges.delete(challengeId);
    throw new Error("Code expired. Please sign in again.");
  }
  if (code.trim() !== c.code) {
    c.attemptsLeft -= 1;
    if (c.attemptsLeft <= 0) {
      challenges.delete(challengeId);
      lockedUntil.set(
        c.email.toLowerCase(),
        Date.now() + (c.role === "customer" ? 5 : 15) * 60_000,
      );
      db.addAudit({
        id: `au-${crypto.randomUUID().slice(0, 6)}`,
        actor: c.email,
        action: "mfa lockout",
        detail: `${c.method} failed too many times`,
        timestamp: new Date().toISOString(),
        ip: "10.4.0.1",
      });
      throw new Error("Too many wrong codes. Account temporarily locked.");
    }
    throw new Error(
      `Incorrect code. ${c.attemptsLeft} attempt${c.attemptsLeft === 1 ? "" : "s"} left.`,
    );
  }
  challenges.delete(challengeId);
  const [next, ...rest] = c.remaining;
  if (next) {
    const n = issueFactor(
      {
        ...c,
        id: crypto.randomUUID(),
        step: c.step + 1,
        remaining: rest,
        attemptsLeft: MFA_POLICY[c.role].attempts,
      },
      next,
    );
    challenges.set(n.id, n);
    return { done: false, challenge: publicChallenge(n) };
  }
  const user = db.findUserById(c.userId)!;
  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: c.role,
    permissions: permissionsFor(c.role),
    avatarInitials: initials(user.name),
  };
  const now = Date.now();
  const session: AuthSession = {
    token: encodeToken({
      sub: sessionUser.id,
      role: sessionUser.role,
      amr: ["pwd", ...MFA_POLICY[c.role].factors],
    }),
    user: sessionUser,
    issuedAt: now,
    expiresAt: now + MFA_POLICY[c.role].sessionMs,
  };
  persist(session);
  db.addAudit({
    id: `au-${crypto.randomUUID().slice(0, 6)}`,
    actor: user.name,
    action: "signed in",
    detail: `MFA: ${MFA_POLICY[c.role].factors.join(" + ")}`,
    timestamp: new Date().toISOString(),
    ip: "10.4.0.1",
  });
  return { done: true, session };
}

/** Re-send a fresh code for the current factor (keeps attempts). */
export async function resendMfa(challengeId: string): Promise<MfaChallenge> {
  await delay(200);
  const c = challenges.get(challengeId);
  if (!c) throw new Error("Verification expired. Please sign in again.");
  const n = issueFactor(c, c.method);
  challenges.set(n.id, n);
  return publicChallenge(n);
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
