import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/mock/api";
import { formatCurrency, maskedAccount } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Icon } from "@/components/icons";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/transfer")({
  head: () => ({ meta: [{ title: "Transfer — Arya Banking" }] }),
  component: TransferPage,
});

function TransferPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: accounts } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: () => api.getAccounts(user!.id),
  });

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  const myAccounts = (accounts ?? []).filter((a) => a.status === "active");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || !amount) return;
    if (from === to) {
      toast.error("Pick a different destination account.");
      return;
    }
    setLoading(true);
    try {
      const amt = Number(amount);
      await api.transfer(from, to, amt, memo);
      toast.success(`Transfer of ${formatCurrency(amt, "USD")} committed`);
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      navigate({ to: "/accounts" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  }

  const fromAccount = myAccounts.find((a) => a.id === from);
  const available = fromAccount?.balance ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Banking"
        title="New transfer"
        description="Move funds between your accounts. Transfers commit to the event stream instantly."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-5"
        >
          <div>
            <label className="text-[12px] font-medium text-foreground">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select source account</option>
              {myAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {maskedAccount(a.number)} · {formatCurrency(a.balance, a.currency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium text-foreground">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select destination account</option>
              {myAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {maskedAccount(a.number)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-medium text-foreground">Amount (USD)</label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pl-7 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {fromAccount && (
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                Available: {formatCurrency(available, fromAccount.currency)}
              </p>
            )}
          </div>

          <div>
            <label className="text-[12px] font-medium text-foreground">Memo (optional)</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. Rent payment"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Committing…" : "Transfer funds"}
            <Icon name="arrow-right" className="size-4" />
          </button>
        </form>

        <aside className="rounded-xl border border-border bg-sidebar p-5">
          <h3 className="text-sm font-semibold text-foreground">How transfers work</h3>
          <ul className="mt-3 space-y-2.5 text-[13px] text-muted-foreground">
            <li className="flex gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />
              Balances update the moment the event commits.
            </li>
            <li className="flex gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />A{" "}
              <span className="font-mono">transfer.settled</span> event is appended to the stream.
            </li>
            <li className="flex gap-2">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-success" />
              Failed events retry, then dead-letter — never silently lost.
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
