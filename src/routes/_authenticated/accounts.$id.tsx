import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mock/api";
import { formatCurrency, maskedAccount, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icons";

export const Route = createFileRoute("/_authenticated/accounts/$id")({
  head: () => ({ meta: [{ title: "Account — Arya Banking" }] }),
  component: AccountDetailPage,
});

function AccountDetailPage() {
  const { id } = useParams({ from: "/_authenticated/accounts/$id" });
  const { data: account, isLoading } = useQuery({
    queryKey: ["account", id],
    queryFn: () => api.getAccount(id),
  });
  const { data: transactions } = useQuery({
    queryKey: ["transactions", id],
    queryFn: () => api.getTransactions(id),
  });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  if (!account)
    return (
      <EmptyState
        title="Account not found"
        description="This account may have been closed or the link is wrong."
        icon={<Icon name="wallet" className="size-5" />}
        action={
          <Link
            to="/accounts"
            className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Back to accounts
          </Link>
        }
      />
    );

  const tx = transactions ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title={account.name}
        description={`${maskedAccount(account.number)} · ${account.type} · opened ${formatDateTime(account.openedAt)}`}
        actions={
          <Link
            to="/transfer"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="arrow-right-left" className="size-4" />
            Transfer
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Available balance"
          value={formatCurrency(account.balance, account.currency)}
          tone="info"
        />
        <StatCard
          label="Status"
          value={<span className="capitalize">{account.status}</span>}
          tone={
            account.status === "active"
              ? "success"
              : account.status === "frozen"
                ? "danger"
                : "warn"
          }
        />
        <StatCard label="Transactions" value={tx.length} />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Counterparty</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
              <th className="px-4 py-2.5 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tx.map((t) => {
              const credit = t.direction === "credit";
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{t.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.counterparty}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={
                        t.status === "settled"
                          ? "success"
                          : t.status === "pending"
                            ? "warn"
                            : "danger"
                      }
                      label={t.status}
                    />
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold ${credit ? "text-success" : "text-foreground"}`}
                  >
                    {credit ? "+" : "−"}
                    {formatCurrency(t.amount, t.currency)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                    {formatDateTime(t.createdAt)}
                  </td>
                </tr>
              );
            })}
            {tx.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
