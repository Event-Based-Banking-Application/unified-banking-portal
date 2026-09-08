import type { Role } from "../auth/types";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

export interface MockAccount {
  id: string;
  userId: string;
  name: string;
  type: "checking" | "savings" | "reserve" | "operating";
  number: string;
  balance: number;
  currency: string;
  status: "active" | "frozen" | "pending";
  openedAt: string;
}

export interface MockTransaction {
  id: string;
  accountId: string;
  description: string;
  counterparty: string;
  amount: number;
  currency: string;
  direction: "credit" | "debit";
  status: "settled" | "pending" | "failed";
  createdAt: string;
}

export type RequestType = "new_account" | "new_user" | "transfer_uplift" | "card_limit";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface MockRequest {
  id: string;
  type: RequestType;
  requesterId: string;
  requesterName: string;
  details: string;
  amount?: number;
  status: RequestStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type ServiceStatus = "healthy" | "degraded" | "alert";

export interface MockService {
  id: string;
  name: string;
  status: ServiceStatus;
  latencyMs: number;
  depth: number;
  uptimePct: number;
  region: string;
}

export type EventLevel = "committed" | "retrying" | "deadletter" | "info";

export interface MockEvent {
  id: string;
  type: string;
  level: EventLevel;
  message: string;
  timestamp: string;
}

export interface MockAuditEntry {
  id: string;
  actor: string;
  action: string;
  detail: string;
  timestamp: string;
  ip: string;
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  new_account: "New account",
  new_user: "New user",
  transfer_uplift: "Transfer uplift",
  card_limit: "Card limit raise",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  alert: "Alert",
};
