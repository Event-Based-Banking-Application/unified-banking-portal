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
  customer: "text-primary-foreground bg-primary ring-primary",
  bank_admin: "text-foreground bg-background ring-foreground",
  system_admin: "text-muted-foreground bg-muted ring-border",
};

