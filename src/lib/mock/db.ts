import type {
  MockAccount,
  MockAuditEntry,
  MockEvent,
  MockRequest,
  MockService,
  MockTransaction,
  MockUser,
  RequestStatus,
} from "./types";
import {
  seedAccounts,
  seedAudit,
  seedEvents,
  seedRequests,
  seedServices,
  seedTransactions,
  seedUsers,
} from "./seed";

// In-memory mutable store. Reset on full reload.
let users: MockUser[] = [...seedUsers];
let accounts: MockAccount[] = [...seedAccounts];
let transactions: MockTransaction[] = [...seedTransactions];
let requests: MockRequest[] = [...seedRequests];
let services: MockService[] = [...seedServices];
let events: MockEvent[] = [...seedEvents];
let audit: MockAuditEntry[] = [...seedAudit];

export const db = {
  findUserByEmail(email: string): MockUser | undefined {
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById(id: string): MockUser | undefined {
    return users.find((u) => u.id === id);
  },
  listUsers(): MockUser[] {
    return [...users];
  },
  listCustomers(): MockUser[] {
    return users.filter((u) => u.role === "customer");
  },
  listBankUsers(): MockUser[] {
    return users.filter((u) => u.role === "bank_admin" || u.role === "system_admin");
  },
  addUser(user: MockUser): void {
    users = [...users, user];
  },
  setUserStatus(id: string, status: MockUser["status"]): void {
    users = users.map((u) => (u.id === id ? { ...u, status } : u));
  },

  listAccounts(userId?: string): MockAccount[] {
    return userId ? accounts.filter((a) => a.userId === userId) : [...accounts];
  },
  findAccount(id: string): MockAccount | undefined {
    return accounts.find((a) => a.id === id);
  },
  findAccountByUserId(userId: string, accountName: string): MockAccount | undefined {
    return accounts.find((a) => a.userId === userId && a.name === accountName);
  },
  adjustBalance(accountId: string, delta: number): void {
    accounts = accounts.map((a) =>
      a.id === accountId ? { ...a, balance: a.balance + delta } : a,
    );
  },

  listTransactions(accountId?: string): MockTransaction[] {
    const list = accountId
      ? transactions.filter((t) => t.accountId === accountId)
      : [...transactions];
    return [...list].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  },
  addTransaction(tx: MockTransaction): void {
    transactions = [tx, ...transactions];
  },

  listRequests(): MockRequest[] {
    return [...requests].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  },
  listRequestsByUser(userId: string): MockRequest[] {
    return requests
      .filter((r) => r.requesterId === userId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },
  addRequest(req: MockRequest): void {
    requests = [req, ...requests];
  },
  setRequestStatus(
    id: string,
    status: RequestStatus,
    resolvedBy: string,
  ): MockRequest | undefined {
    let updated: MockRequest | undefined;
    requests = requests.map((r) => {
      if (r.id === id) {
        updated = {
          ...r,
          status,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
        };
        return updated;
      }
      return r;
    });
    return updated;
  },

  listServices(): MockService[] {
    return [...services];
  },

  listEvents(): MockEvent[] {
    return [...events];
  },
  prependEvent(ev: MockEvent): void {
    events = [ev, ...events].slice(0, 50);
  },

  listAudit(): MockAuditEntry[] {
    return [...audit].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
    );
  },
  addAudit(entry: MockAuditEntry): void {
    audit = [entry, ...audit];
  },
};
