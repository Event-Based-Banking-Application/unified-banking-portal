import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/mock/api";
import { formatCurrency, maskedAccount, formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { EventFeed } from "@/components/event-feed";
import { Icon } from "@/components/icons";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  SERVICE_STATUS_LABELS,
  type RequestStatus,
  type ServiceStatus,
} from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Vantage" }],
  }),
  component: DashboardPage,
});

const reqTone: Record<RequestStatus, "warn" | "success" | "danger"> = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};
const svcTone: Record<ServiceStatus, "success" | "warn" | "danger"> = {
  healthy: "success",
  degraded: "warn",
  alert: "danger",
};

function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "customer") return <CustomerDashboard />;
  if (user?.role === "bank_admin") return <BankAdminDashboard />;
  return <SystemAdminDashboard />;
}

function CustomerDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const { data: accounts } = useQuery({
    queryKey: ["accounts", user.id],
    queryFn: () => api.getAccounts(user.id),
  });
  const { data: requests } = useQuery({
    queryKey: ["requests", user.id],
    queryFn: () => api.getRequests(user.id),
  });
  const total = (accounts ?? []).reduce((s, a) => s + a.balance, 0);
  const pending = (requests ?? []).filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your accounts, recent activity, and open requests."
        actions={
          <Link
            to="/transfer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="arrow-right-left" className="size-4" />
            New transfer
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total balance" value={formatCurrency(total, "USD")} tone="info" />
        <StatCard label="Accounts" value={accounts?.length ?? 0} />
        <StatCard label="Open requests" value={pending} tone={pending ? "warn" : "muted"} />
        <StatCard label="This month" value="—" sub="inflows settle on commit" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Your accounts</h2>
            <Link to="/accounts" className="text-[12px] text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {(accounts ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {maskedAccount(a.number)} · {a.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {formatCurrency(a.balance, a.currency)}
                  </p>
                  <StatusPill
                    tone={a.status === "active" ? "success" : a.status === "frozen" ? "danger" : "warn"}
                    label={a.status}
                  />
                </div>
              </li>
            ))}
            {accounts?.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No accounts yet.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Your requests</h2>
            <Link to="/requests" className="text-[12px] text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {(requests ?? []).slice(0, 4).map((r) => (
              <li key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {REQUEST_TYPE_LABELS[r.type]}
                  </span>
                  <StatusPill tone={reqTone[r.status]} label={REQUEST_STATUS_LABELS[r.status]} />
                </div>
                <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  {r.id} · {timeAgo(r.createdAt)}
                </p>
              </li>
            ))}
            {requests?.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                No requests yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function BankAdminDashboard() {
  const { data: requests } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.getRequests(),
  });
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getCustomers(),
  });
  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const approved = (requests ?? []).filter((r) => r.status === "approved").length;
  const rejected = (requests ?? []).filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bank admin"
        title="Approvals & banking overview"
        description="Pending requests from customers across the platform."
        actions={
          <Link
            to="/approvals"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="check-square" className="size-4" />
            Open approvals
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={pending.length} tone="warn" live={pending.length > 0} />
        <StatCard label="Approved" value={approved} tone="success" />
        <StatCard label="Rejected" value={rejected} tone="danger" />
        <StatCard label="Customers" value={customers?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Pending requests</h2>
            <Link to="/approvals" className="text-[12px] text-primary hover:underline">
              Review all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {pending.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {REQUEST_TYPE_LABELS[r.type]}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {r.id} · {r.requesterName} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <Link
                  to="/approvals"
                  className="rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-muted"
                >
                  Review
                </Link>
              </li>
            ))}
            {pending.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing pending. Nice.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Live event stream</h2>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <EventFeed limit={8} />
          </div>
        </section>
      </div>
    </div>
  );
}

function SystemAdminDashboard() {
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
  });
  const { data: audit } = useQuery({
    queryKey: ["audit"],
    queryFn: () => api.getAudit(),
  });
  const healthy = (services ?? []).filter((s) => s.status === "healthy").length;
  const degraded = (services ?? []).filter((s) => s.status === "degraded").length;
  const alert = (services ?? []).filter((s) => s.status === "alert").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System admin"
        title="Infrastructure console"
        description="Service health, event flow, and audit across the event core."
        actions={
          <Link
            to="/console"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="activity" className="size-4" />
            Open console
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Healthy services" value={healthy} tone="success" />
        <StatCard label="Degraded" value={degraded} tone="warn" />
        <StatCard label="Alerts" value={alert} tone={alert ? "danger" : "muted"} live={alert > 0} />
        <StatCard label="Audit entries" value={audit?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Service health</h2>
          </div>
          <ul className="divide-y divide-border">
            {(services ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {s.region} · {s.latencyMs}ms · depth {s.depth}
                  </p>
                </div>
                <StatusPill tone={svcTone[s.status]} label={SERVICE_STATUS_LABELS[s.status]} live={s.status !== "healthy"} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Live event stream</h2>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <EventFeed limit={10} />
          </div>
        </section>
      </div>
    </div>
  );
}
