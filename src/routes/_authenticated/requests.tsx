import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/mock/api";
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icons";
import { toast } from "sonner";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
  type RequestType,
} from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "My requests — Vantage" }] }),
  component: RequestsPage,
});

const reqTone: Record<RequestStatus, "warn" | "success" | "danger"> = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};

function RequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: requests } = useQuery({
    queryKey: ["requests", user?.id],
    queryFn: () => api.getRequests(user!.id),
  });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RequestType>("new_account");
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.createRequest({
        requesterId: user.id,
        requesterName: user.name,
        type,
        details: details || REQUEST_TYPE_LABELS[type],
        amount: amount ? Number(amount) : undefined,
      });
      toast.success("Request submitted");
      qc.invalidateQueries({ queryKey: ["requests", user.id] });
      setOpen(false);
      setDetails("");
      setAmount("");
    } finally {
      setLoading(false);
    }
  }

  const list = requests ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customer"
        title="My requests"
        description="Requests you've raised. A bank admin reviews and approves each one."
        actions={
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="plus" className="size-4" />
            New request
          </button>
        }
      />

      {open && (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-border bg-card p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[12px] font-medium text-foreground">Request type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RequestType)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {(Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((t) => (
                  <option key={t} value={t}>
                    {REQUEST_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground">
                Amount (if applicable)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground">Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Describe what you need…"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}

      {list.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Raise a request to open a new account, add a user, or increase a card limit."
          icon={<Icon name="inbox" className="size-5" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-right font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{REQUEST_TYPE_LABELS[r.type]}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{r.id}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.details}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={reqTone[r.status]} label={REQUEST_STATUS_LABELS[r.status]} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {r.amount ? formatCurrency(r.amount, "USD") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                    {timeAgo(r.createdAt)}
                    <span className="block text-[10px] opacity-70">{formatDateTime(r.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
