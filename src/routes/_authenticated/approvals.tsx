import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/mock/api";
import { formatCurrency, formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icons";
import { toast } from "sonner";
import { REQUEST_TYPE_LABELS, REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({ meta: [{ title: "Approvals — Arya Banking" }] }),
  component: ApprovalsPage,
});

const reqTone: Record<RequestStatus, "warn" | "success" | "danger"> = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};

function ApprovalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | RequestStatus>("pending");
  const { data: requests } = useQuery({
    queryKey: ["requests"],
    queryFn: () => api.getRequests(),
  });

  const all = requests ?? [];
  const list = filter === "all" ? all : all.filter((r) => r.status === filter);
  const pending = all.filter((r) => r.status === "pending");
  const approved = all.filter((r) => r.status === "approved");
  const rejected = all.filter((r) => r.status === "rejected");

  async function resolve(id: string, status: "approved" | "rejected") {
    if (!user) return;
    try {
      await api.resolveRequest(id, status, user.name);
      toast.success(`Request ${status}`);
      qc.invalidateQueries({ queryKey: ["requests"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bank admin"
        title="Approvals"
        description="Review and resolve customer requests across the platform."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} tone="warn" live={pending.length > 0} />
        <StatCard label="Approved" value={approved.length} tone="success" />
        <StatCard label="Rejected" value={rejected.length} tone="danger" />
      </div>

      <div className="flex gap-1.5">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No requests here"
          description={`No ${filter} requests to show.`}
          icon={<Icon name="check-square" className="size-5" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Request</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-right font-medium">Submitted</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{REQUEST_TYPE_LABELS[r.type]}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{r.id}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{r.details}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.requesterName}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={reqTone[r.status]} label={REQUEST_STATUS_LABELS[r.status]} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {r.amount ? formatCurrency(r.amount, "USD") : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                    {timeAgo(r.createdAt)}
                    {r.resolvedAt && (
                      <span className="block text-[10px] opacity-70">
                        by {r.resolvedBy} · {formatDateTime(r.resolvedAt)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => resolve(r.id, "approved")}
                          className="rounded-md bg-success/15 px-2.5 py-1 text-[12px] font-medium text-success hover:bg-success/25"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => resolve(r.id, "rejected")}
                          className="rounded-md bg-destructive/15 px-2.5 py-1 text-[12px] font-medium text-destructive hover:bg-destructive/25"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-muted-foreground">—</span>
                    )}
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
