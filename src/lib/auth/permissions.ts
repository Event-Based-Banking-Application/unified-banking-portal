import type { Permission, Role } from "./types";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  customer: [
    "accounts:read",
    "accounts:transfer",
    "requests:create",
    "requests:read",
    "profile:read",
  ],
  bank_admin: [
    "accounts:read:all",
    "requests:approve",
    "requests:read",
    "users:read",
    "bankusers:manage",
    "audit:read",
    "profile:read",
  ],
  system_admin: [
    "infra:read",
    "events:read",
    "audit:read",
    "users:read",
    "profile:read",
  ],
};

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(
  user: { permissions: Permission[] } | null | undefined,
  permission: Permission,
): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function canAny(
  user: { permissions: Permission[] } | null | undefined,
  permissions: Permission[],
): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export const PERMISSION_GROUPS: {
  label: string;
  items: { key: Permission; label: string }[];
}[] = [
  {
    label: "Banking",
    items: [
      { key: "accounts:read", label: "View own accounts" },
      { key: "accounts:read:all", label: "View all accounts" },
      { key: "accounts:transfer", label: "Transfer funds" },
    ],
  },
  {
    label: "Requests",
    items: [
      { key: "requests:create", label: "Raise requests" },
      { key: "requests:read", label: "View requests" },
      { key: "requests:approve", label: "Approve requests" },
    ],
  },
  {
    label: "Users",
    items: [
      { key: "users:read", label: "View customers" },
      { key: "bankusers:manage", label: "Manage bank users" },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { key: "infra:read", label: "View service health" },
      { key: "events:read", label: "View event stream" },
      { key: "audit:read", label: "View audit log" },
    ],
  },
];
