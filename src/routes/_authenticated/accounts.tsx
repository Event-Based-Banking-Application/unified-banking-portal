import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/mock/api";
import { formatCurrency, maskedAccount, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icons";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Arya Banking" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { user } = useAuth();
  const isBankAdmin = user?.role === "bank_admin";
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["accounts", isBankAdmin ? "all" : user?.id],
    queryFn: () => (isBankAdmin ? api.getAccounts() : api.getAccounts(user!.id)),
  });

  const list = accounts ?? [];
  const total = list.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Banking"
        title={isBankAdmin ? "All accounts" : "Your accounts"}
        description={
          isBankAdmin
            ? "Every account on the platform."
            : "Balances and activity across your accounts."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total balance" value={formatCurrency(total, "USD")} tone="info" />
        <StatCard label="Accounts" value={list.length} />
        <StatCard
          label="Active"
          value={list.filter((a) => a.status === "active").length}
          tone="success"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Account</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Balance</th>
              <th className="px-4 py-2.5 text-right font-medium">Opened</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{a.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {maskedAccount(a.number)}
                  </p>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{a.type}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    tone={
                      a.status === "active" ? "success" : a.status === "frozen" ? "danger" : "warn"
                    }
                    label={a.status}
                  />
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                  {formatCurrency(a.balance, a.currency)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                  {formatDateTime(a.openedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/accounts/$id"
                    params={{ id: a.id }}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                  >
                    View <Icon name="arrow-right" className="size-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && list.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No accounts"
              description="You don't have any accounts yet. Raise a request to open one."
              icon={<Icon name="wallet" className="size-5" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
