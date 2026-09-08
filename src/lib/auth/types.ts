export type Role = "customer" | "bank_admin" | "system_admin";

export type Permission =
  // customer
  | "accounts:read"
  | "accounts:transfer"
  | "requests:create"
  | "requests:read"
  // bank admin
  | "accounts:read:all"
  | "requests:approve"
  | "users:read"
  | "bankusers:manage"
  // system admin
  | "infra:read"
  | "events:read"
  | "audit:read"
  // shared
  | "profile:read";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  avatarInitials: string;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
  issuedAt: number;
  expiresAt: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  bank_admin: "Bank Admin",
  system_admin: "System Admin",
};

export const ROLE_TONES: Record<Role, string> = {
  customer: "text-accent bg-accent/10 ring-accent/30",
  bank_admin: "text-warn bg-warn/10 ring-warn/30",
  system_admin: "text-info bg-info/10 ring-info/30",
};
