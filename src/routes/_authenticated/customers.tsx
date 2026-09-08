import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { api } from "@/lib/mock/api";
import { formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { StatCard } from "@/components/stat-card";
import { Icon } from "@/components/icons";
import { toast } from "sonner";
import type { MockUser } from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers — Vantage" }] }),
  component: CustomersPage,
});

const statusTone = (s: MockUser["status"]) =>
  s === "active" ? "success" : s === "pending" ? "warn" : "danger";

function CustomersPage() {
  const qc = useQueryClient();
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.getCustomers(),
  });
  const list = customers ?? [];
  const active = list.filter((c) => c.status === "active").length;
  const pending = list.filter((c) => c.status === "pending").length;

  async function toggle(id: string, current: MockUser["status"]) {
    const next = current === "active" ? "suspended" : "active";
    await api.setUserStatus(id, next);
    toast.success(`${next === "active" ? "Activated" : "Suspended"} customer`);
    qc.invalidateQueries({ queryKey: ["customers"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bank admin"
        title="Customers"
        description="All customer accounts on the platform."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={list.length} />
        <StatCard label="Active" value={active} tone="success" />
        <StatCard label="Pending" value={pending} tone="warn" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Joined</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={statusTone(c.status)} label={c.status} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                  {timeAgo(c.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(c.id, c.status)}
                    disabled={c.status === "pending"}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                      c.status === "active"
                        ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                        : "bg-success/15 text-success hover:bg-success/25"
                    }`}
                  >
                    {c.status === "active" ? "Suspend" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
