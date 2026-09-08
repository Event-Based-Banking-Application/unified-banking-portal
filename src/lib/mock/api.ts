import { db } from "./db";
import type {
  MockAccount,
  MockAuditEntry,
  MockEvent,
  MockRequest,
  MockService,
  MockTransaction,
  MockUser,
  RequestStatus,
  RequestType,
} from "./types";

function delay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const api = {
  // Accounts
  async getAccounts(userId?: string): Promise<MockAccount[]> {
    await delay();
    return db.listAccounts(userId);
  },
  async getAccount(id: string): Promise<MockAccount | undefined> {
    await delay();
    return db.findAccount(id);
  },
  async getTransactions(accountId?: string): Promise<MockTransaction[]> {
    await delay();
    return db.listTransactions(accountId);
  },

  // Transfers
  async transfer(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
  ): Promise<MockTransaction> {
    await delay(400);
    const from = db.findAccount(fromAccountId);
    const to = db.findAccount(toAccountId);
    if (!from) throw new Error("Source account not found");
    if (!to) throw new Error("Destination account not found");
    if (from.balance < amount) throw new Error("Insufficient funds");
    db.adjustBalance(fromAccountId, -amount);
    db.adjustBalance(toAccountId, amount);
    const tx: MockTransaction = {
      id: uid("tx"),
      accountId: fromAccountId,
      description: description || "Transfer",
      counterparty: to.name,
      amount,
      currency: from.currency,
      direction: "debit",
      status: "settled",
      createdAt: new Date().toISOString(),
    };
    db.addTransaction(tx);
    db.prependEvent({
      id: uid("ev"),
      type: "transfer.settled",
      level: "committed",
      message: `${from.number} → ${to.number} · ${amount.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });
    return tx;
  },

  // Requests
  async getRequests(userId?: string): Promise<MockRequest[]> {
    await delay();
    return userId ? db.listRequestsByUser(userId) : db.listRequests();
  },
  async createRequest(input: {
    requesterId: string;
    requesterName: string;
    type: RequestType;
    details: string;
    amount?: number;
  }): Promise<MockRequest> {
    await delay(400);
    const req: MockRequest = {
      id: uid("req"),
      type: input.type,
      requesterId: input.requesterId,
      requesterName: input.requesterName,
      details: input.details,
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    db.addRequest(req);
    db.addAudit({
      id: uid("au"),
      actor: input.requesterName,
      action: `raised ${req.id}`,
      detail: input.details,
      timestamp: new Date().toISOString(),
      ip: "10.4.3.51",
    });
    return req;
  },
  async resolveRequest(
    id: string,
    status: RequestStatus,
    resolverName: string,
  ): Promise<MockRequest | undefined> {
    await delay(350);
    const updated = db.setRequestStatus(id, status, resolverName);
    if (updated) {
      db.addAudit({
        id: uid("au"),
        actor: resolverName,
        action: `${status} ${id}`,
        detail: updated.details,
        timestamp: new Date().toISOString(),
        ip: "10.4.1.77",
      });
      db.prependEvent({
        id: uid("ev"),
        type: status === "approved" ? "approval.granted" : "approval.rejected",
        level: "committed",
        message: `${id} · ${updated.type}`,
        timestamp: new Date().toISOString(),
      });
    }
    return updated;
  },

  // Users
  async getCustomers(): Promise<MockUser[]> {
    await delay();
    return db.listCustomers();
  },
  async getBankUsers(): Promise<MockUser[]> {
    await delay();
    return db.listBankUsers();
  },
  async setUserStatus(id: string, status: MockUser["status"]): Promise<void> {
    await delay(300);
    db.setUserStatus(id, status);
  },

  // Infrastructure
  async getServices(): Promise<MockService[]> {
    await delay();
    return db.listServices();
  },
  async getEvents(): Promise<MockEvent[]> {
    await delay();
    return db.listEvents();
  },
  async getAudit(): Promise<MockAuditEntry[]> {
    await delay();
    return db.listAudit();
  },
};

export type Api = typeof api;
