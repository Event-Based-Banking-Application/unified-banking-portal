import type { QueryClient } from "@tanstack/react-query";
import type { Permission, SessionUser } from "@/lib/auth/types";
import { ROLE_LABELS } from "@/lib/auth/types";
import { api } from "@/lib/mock/api";
import { formatCurrency, formatDateTime, maskedAccount } from "@/lib/format";
import { NAV_GROUPS } from "@/lib/nav";
import type { MockAccount, RequestType } from "@/lib/mock/types";

export type Line =
  | { kind: "text"; text: string; tone?: "muted" | "ok" | "warn" | "error" }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "link"; text: string; to: string };

export interface Ctx {
  user: SessionUser;
  args: string[];
  flags: Record<string, string | true>;
  queryClient: QueryClient;
  navigate: (to: string) => void;
  signOut: () => void;
  confirm: (prompt: string, action: () => Promise<Line[]>) => Line[];
  history: string[];
  clear: () => void;
}

export interface Command {
  name: string;
  aliases?: string[];
  usage: string;
  summary: string;
  permission?: Permission;
  run: (ctx: Ctx) => Promise<Line[]> | Line[];
}

const t = (text: string, tone?: "muted" | "ok" | "warn" | "error"): Line => ({
  kind: "text",
  text,
  ...(tone ? { tone } : {}),
});

/** Split input respecting quotes; extract --flag value pairs. */
export function parse(input: string) {
  const tokens = input.match(/"[^"]*"|'[^']*'|\S+/g)?.map((s) => s.replace(/^["']|["']$/g, "")) ?? [];
  const args: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]!;
    if (tok.startsWith("--")) {
      const next = tokens[i + 1];
      if (next && !next.startsWith("--")) {
        flags[tok.slice(2)] = next;
        i++;
      } else flags[tok.slice(2)] = true;
    } else args.push(tok);
  }
  return { args, flags };
}

function findAccount(list: MockAccount[], q: string | undefined) {
  if (!q) return undefined;
  const s = q.toLowerCase();
  return list.find(
    (a) =>
      a.id.toLowerCase() === s ||
      a.type === s ||
      a.number.endsWith(s) ||
      a.name.toLowerCase().includes(s),
  );
}

function invalidate(qc: QueryClient) {
  qc.invalidateQueries();
}

const PAGE_ALIASES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items).flatMap((i) => [
    [i.to.slice(1), i.to],
    [i.label.toLowerCase().replace(/\s+/g, "-"), i.to],
  ]),
);

export const COMMANDS: Command[] = [
  {
    name: "help",
    usage: "help [command]",
    summary: "List commands you can run",
    run: ({ args, user }) => {
      const mine = available(user);
      if (args[0]) {
        const c = resolve(args.join(" "))?.cmd;
        if (!c) return [t(`No command "${args[0]}".`, "error")];
        return [t(c.usage, "ok"), t(c.summary, "muted"), ...(c.aliases?.length ? [t(`aliases: ${c.aliases.join(", ")}`, "muted")] : [])];
      }
      return [
        t(`Commands available to ${ROLE_LABELS[user.role]}:`, "muted"),
        { kind: "table", head: ["Command", "What it does"], rows: mine.map((c) => [c.usage, c.summary]) },
        t('Tip: Tab autocompletes, ↑/↓ browse history, Esc closes.', "muted"),
      ];
    },
  },
  {
    name: "whoami",
    usage: "whoami",
    summary: "Show your identity and permissions",
    run: ({ user }) => [
      t(`${user.name} <${user.email}>`, "ok"),
      t(`role: ${ROLE_LABELS[user.role]}`),
      t(`permissions: ${user.permissions.join(", ")}`, "muted"),
    ],
  },
  {
    name: "go",
    aliases: ["open"],
    usage: "go <page>",
    summary: "Open a page, e.g. go accounts",
    run: ({ args, user, navigate }) => {
      const key = args.join("-").toLowerCase();
      const pages = NAV_GROUPS.flatMap((g) => g.items).filter((i) => user.permissions.includes(i.permission));
      const to = PAGE_ALIASES[key];
      if (!to || !pages.some((p) => p.to === to))
        return [t(`Unknown page "${key}". Try: ${pages.map((p) => p.to.slice(1)).join(", ")}`, "error")];
      navigate(to);
      return [t(`→ ${to}`, "ok")];
    },
  },
  { name: "clear", aliases: ["cls"], usage: "clear", summary: "Clear the screen", run: ({ clear }) => (clear(), []) },
  {
    name: "history",
    usage: "history",
    summary: "Show commands you ran",
    run: ({ history }) => (history.length ? history.map((h, i) => t(`${String(i + 1).padStart(3)}  ${h}`)) : [t("No history yet.", "muted")]),
  },
  {
    name: "logout",
    aliases: ["exit", "sign out"],
    usage: "logout",
    summary: "Sign out",
    run: ({ signOut }) => (signOut(), [t("Signed out.", "ok")]),
  },

  // Customer
  {
    name: "balance",
    usage: "balance",
    summary: "Your total and per-account balances",
    permission: "accounts:read",
    run: async ({ user }) => {
      const list = await api.getAccounts(user.id);
      const total = list.reduce((s, a) => s + a.balance, 0);
      return [
        { kind: "table", head: ["Account", "Number", "Balance"], rows: list.map((a) => [a.name, maskedAccount(a.number), formatCurrency(a.balance, a.currency)]) },
        t(`Total: ${formatCurrency(total, list[0]?.currency ?? "USD")}`, "ok"),
      ];
    },
  },
  {
    name: "accounts",
    usage: "accounts",
    summary: "List accounts",
    permission: "accounts:read",
    run: async ({ user }) => {
      const list = await api.getAccounts(user.permissions.includes("accounts:read:all") ? undefined : user.id);
      return [
        { kind: "table", head: ["Id", "Name", "Type", "Status", "Balance"], rows: list.map((a) => [a.id, a.name, a.type, a.status, formatCurrency(a.balance, a.currency)]) },
        ...list.map((a) => ({ kind: "link" as const, text: `open ${a.name}`, to: `/accounts/${a.id}` })),
      ];
    },
  },
  {
    name: "transactions",
    aliases: ["tx"],
    usage: "transactions [account]",
    summary: "Recent activity, optionally for one account",
    permission: "accounts:read",
    run: async ({ user, args }) => {
      const accts = await api.getAccounts(user.id);
      const acct = findAccount(accts, args[0]);
      if (args[0] && !acct) return [t(`No account matching "${args[0]}".`, "error")];
      const ids = new Set(accts.map((a) => a.id));
      const txs = (await api.getTransactions(acct?.id)).filter((x) => ids.has(x.accountId)).slice(0, 15);
      if (!txs.length) return [t("No transactions.", "muted")];
      return [{ kind: "table", head: ["Date", "Description", "Counterparty", "Amount"], rows: txs.map((x) => [formatDateTime(x.createdAt), x.description, x.counterparty, `${x.direction === "debit" ? "−" : "+"}${formatCurrency(x.amount, x.currency)}`]) }];
    },
  },
  {
    name: "transfer",
    aliases: ["send", "pay"],
    usage: 'transfer <amount> from <account> to <account> [note "text"]',
    summary: "Move money between your accounts",
    permission: "accounts:transfer",
    run: async ({ user, args, flags, confirm, queryClient }) => {
      const amount = Number(args[0]);
      const fromI = args.indexOf("from"), toI = args.indexOf("to"), noteI = args.indexOf("note");
      if (!amount || amount <= 0 || fromI < 0 || toI < 0)
        return [t('Usage: transfer 250 from checking to savings note "rent"', "error")];
      const accts = await api.getAccounts(user.id);
      const from = findAccount(accts, args.slice(fromI + 1, toI).join(" "));
      const to = findAccount(accts, args.slice(toI + 1, noteI > 0 ? noteI : undefined).join(" "));
      if (!from || !to) return [t(`Couldn't find ${!from ? "source" : "destination"} account. Run "accounts" to see names.`, "error")];
      if (from.id === to.id) return [t("Source and destination must differ.", "error")];
      const memo = noteI > 0 ? args.slice(noteI + 1).join(" ") : typeof flags["note"] === "string" ? flags["note"] : "CLI transfer";
      return confirm(`Transfer ${formatCurrency(amount, from.currency)} from ${from.name} to ${to.name}?`, async () => {
        const tx = await api.transfer(from.id, to.id, amount, memo);
        invalidate(queryClient);
        return [t(`✓ Transfer settled (${tx.id}).`, "ok")];
      });
    },
  },
  {
    name: "request",
    usage: "request account <type> | request card-limit <amount> | request user <name> <email>",
    summary: "Raise a request for bank approval",
    permission: "requests:create",
    run: async ({ user, args, confirm, queryClient }) => {
      const [kind, ...rest] = args;
      let type: RequestType, details: string, amount: number | undefined;
      if (kind === "account") { type = "new_account"; details = `Open ${rest[0] ?? "savings"} account`; }
      else if (kind === "card-limit" || kind === "limit") { type = "card_limit"; amount = Number(rest[0]); if (!amount) return [t("Usage: request card-limit 5000", "error")]; details = `Raise card limit to ${amount}`; }
      else if (kind === "user") { type = "new_user"; if (rest.length < 2) return [t('Usage: request user "Jane Doe" jane@mail.com', "error")]; details = `Add user ${rest[0]} (${rest[1]})`; }
      else return [t("Usage: request account savings | request card-limit 5000 | request user \"Name\" email", "error")];
      return confirm(`Raise request: ${details}?`, async () => {
        const r = await api.createRequest({ requesterId: user.id, requesterName: user.name, type, details, ...(amount !== undefined ? { amount } : {}) });
        invalidate(queryClient);
        return [t(`✓ Request ${r.id} submitted — awaiting bank approval.`, "ok")];
      });
    },
  },
  {
    name: "my requests",
    aliases: ["requests"],
    usage: "my requests",
    summary: "Track your requests",
    permission: "requests:create",
    run: async ({ user }) => {
      const list = await api.getRequests(user.id);
      if (!list.length) return [t("No requests yet.", "muted")];
      return [{ kind: "table", head: ["Id", "Type", "Details", "Status"], rows: list.map((r) => [r.id, r.type, r.details, r.status.toUpperCase()]) }];
    },
  },

  // Bank admin
  {
    name: "pending",
    aliases: ["queue", "approvals"],
    usage: "pending",
    summary: "Requests awaiting approval",
    permission: "requests:approve",
    run: async () => {
      const list = (await api.getRequests()).filter((r) => r.status === "pending");
      if (!list.length) return [t("Queue is empty.", "ok")];
      return [{ kind: "table", head: ["Id", "Type", "Requester", "Details"], rows: list.map((r) => [r.id, r.type, r.requesterName, r.details]) }, t('Run "approve <id>" or "reject <id>".', "muted")];
    },
  },
  ...(["approve", "reject"] as const).map<Command>((verb) => ({
    name: verb,
    usage: `${verb} <request-id>`,
    summary: verb === "approve" ? "Approve a pending request" : "Reject a pending request",
    permission: "requests:approve",
    run: async ({ args, user, confirm, queryClient }) => {
      const id = args[0];
      if (!id) return [t(`Usage: ${verb} req-118`, "error")];
      const req = (await api.getRequests()).find((r) => r.id.toLowerCase() === id.toLowerCase());
      if (!req) return [t(`Request ${id} not found. Run "pending".`, "error")];
      if (req.status !== "pending") return [t(`${req.id} is already ${req.status}.`, "warn")];
      return confirm(`${verb === "approve" ? "Approve" : "Reject"} ${req.id} (${req.details}) from ${req.requesterName}?`, async () => {
        await api.resolveRequest(req.id, verb === "approve" ? "approved" : "rejected", user.name);
        invalidate(queryClient);
        return [t(`✓ ${req.id} ${verb === "approve" ? "approved" : "rejected"}.`, "ok")];
      });
    },
  })),
  {
    name: "customers",
    usage: "customers",
    summary: "List customers",
    permission: "users:read",
    run: async () => {
      const list = await api.getCustomers();
      return [{ kind: "table", head: ["Name", "Email", "Status"], rows: list.map((u) => [u.name, u.email, u.status.toUpperCase()]) }];
    },
  },
  ...(["suspend", "activate"] as const).map<Command>((verb) => ({
    name: verb,
    usage: `${verb} <email>`,
    summary: verb === "suspend" ? "Suspend a customer" : "Re-activate a customer",
    permission: "bankusers:manage",
    run: async ({ args, confirm, queryClient }) => {
      const email = args[0]?.toLowerCase();
      if (!email) return [t(`Usage: ${verb} theo@example.com`, "error")];
      const u = [...(await api.getCustomers()), ...(await api.getBankUsers())].find((x) => x.email.toLowerCase() === email || x.name.toLowerCase().startsWith(email));
      if (!u) return [t(`No user matching "${email}".`, "error")];
      return confirm(`${verb === "suspend" ? "Suspend" : "Activate"} ${u.name}?`, async () => {
        await api.setUserStatus(u.id, verb === "suspend" ? "suspended" : "active");
        invalidate(queryClient);
        return [t(`✓ ${u.name} is now ${verb === "suspend" ? "suspended" : "active"}.`, "ok")];
      });
    },
  })),
  {
    name: "bank users",
    usage: "bank users",
    summary: "List bank staff accounts",
    permission: "bankusers:manage",
    run: async () => {
      const list = await api.getBankUsers();
      return [{ kind: "table", head: ["Name", "Email", "Role", "Status"], rows: list.map((u) => [u.name, u.email, ROLE_LABELS[u.role], u.status.toUpperCase()]) }];
    },
  },

  // System admin
  {
    name: "status",
    aliases: ["health"],
    usage: "status",
    summary: "Service health summary",
    permission: "infra:read",
    run: async () => {
      const list = await api.getServices();
      const bad = list.filter((s) => s.status !== "healthy");
      return [
        t(`${list.length - bad.length}/${list.length} services healthy`, bad.length ? "warn" : "ok"),
        ...bad.map((s) => t(`  ! ${s.name} is ${s.status} (${s.latencyMs}ms, depth ${s.depth})`, s.status === "alert" ? "error" : "warn")),
      ];
    },
  },
  {
    name: "services",
    usage: "services",
    summary: "Full service table",
    permission: "infra:read",
    run: async () => {
      const list = await api.getServices();
      return [{ kind: "table", head: ["Service", "Region", "Status", "Latency", "Depth", "Uptime"], rows: list.map((s) => [s.name, s.region, s.status.toUpperCase(), `${s.latencyMs}ms`, String(s.depth), `${s.uptimePct}%`]) }];
    },
  },
  {
    name: "events",
    aliases: ["tail"],
    usage: "events [--level deadletter]",
    summary: "Recent events from the stream",
    permission: "events:read",
    run: async ({ flags }) => {
      let list = await api.getEvents();
      if (typeof flags["level"] === "string") list = list.filter((e) => e.level === flags["level"]);
      if (!list.length) return [t("No events.", "muted")];
      return [{ kind: "table", head: ["Time", "Level", "Type", "Message"], rows: list.slice(0, 20).map((e) => [formatDateTime(e.timestamp), e.level.toUpperCase(), e.type, e.message]) }];
    },
  },
  {
    name: "audit",
    usage: "audit [--last 20]",
    summary: "Audit log entries",
    permission: "audit:read",
    run: async ({ flags }) => {
      const n = Number(flags["last"]) || 10;
      const list = (await api.getAudit()).slice(0, n);
      return [{ kind: "table", head: ["Time", "Actor", "Action", "Detail"], rows: list.map((a) => [formatDateTime(a.timestamp), a.actor, a.action, a.detail]) }];
    },
  },
];

export function available(user: SessionUser) {
  return COMMANDS.filter((c) => !c.permission || user.permissions.includes(c.permission));
}

/** Match the longest command name/alias prefix (supports multi-word names). */
export function resolve(input: string): { cmd: Command; rest: string } | undefined {
  const lower = input.trim().toLowerCase();
  let best: { cmd: Command; rest: string; len: number } | undefined;
  for (const cmd of COMMANDS) {
    for (const n of [cmd.name, ...(cmd.aliases ?? [])]) {
      if ((lower === n || lower.startsWith(n + " ")) && (!best || n.length > best.len))
        best = { cmd, rest: input.trim().slice(n.length), len: n.length };
    }
  }
  return best;
}
