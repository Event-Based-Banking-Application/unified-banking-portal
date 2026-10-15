import type { Permission } from "./auth/types";

export interface NavItem {
  label: string;
  to: string;
  permission: Permission;
  icon: string; // simple svg path or symbol key
}

export interface NavGroupDef {
  label: string;
  items: NavItem[];
}

// Icon keys resolved to inline SVG in NavGroup component.
export const NAV_GROUPS: NavGroupDef[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", permission: "profile:read", icon: "activity" }],
  },
  {
    label: "Customer",
    items: [
      { label: "Accounts", to: "/accounts", permission: "accounts:read", icon: "wallet" },
      {
        label: "Transfer",
        to: "/transfer",
        permission: "accounts:transfer",
        icon: "arrow-right-left",
      },
      { label: "My requests", to: "/requests", permission: "requests:create", icon: "inbox" },
    ],
  },
  {
    label: "Bank Admin",
    items: [
      {
        label: "Approvals",
        to: "/approvals",
        permission: "requests:approve",
        icon: "check-square",
      },
      { label: "Customers", to: "/customers", permission: "users:read", icon: "users" },
      { label: "Bank users", to: "/bank-users", permission: "bankusers:manage", icon: "shield" },
    ],
  },
  {
    label: "System Admin",
    items: [
      { label: "Console", to: "/console", permission: "infra:read", icon: "activity" },
      { label: "Event stream", to: "/events", permission: "events:read", icon: "radio" },
      { label: "Audit log", to: "/audit", permission: "audit:read", icon: "scroll" },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Profile", to: "/profile", permission: "profile:read", icon: "user" }],
  },
];
