import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/mock/api";
import { formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { StatCard } from "@/components/stat-card";
import { RoleBadge } from "@/components/role-badge";
import { Icon } from "@/components/icons";
import { toast } from "sonner";
import type { MockUser } from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/bank-users")({
  head: () => ({ meta: [{ title: "Bank users — Vantage" }] }),
  component: BankUsersPage,
});

const statusTone = (s: MockUser["status"]) =>
  s === "active" ? "success" : s === "pending" ? "warn" : "danger";

function BankUsersPage() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["bank-users"],
    queryFn: () => api.getBankUsers(),
  });
  const list = users ?? [];
  const active = list.filter((u) => u.status === "active").length;

  async function toggle(id: string, current: MockUser["status"]) {
    const next = current === "active" ? "suspended" : "active";
    await api.setUserStatus(id, next);
    toast.success(`${next === "active" ? "Activated" : "Suspended"} user`);
    qc.invalidateQueries({ queryKey: ["bank-users"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bank admin"
        title="Bank users"
        description="Admin and operations staff with platform access."
        actions={
          <button
            onClick={() =>
              toast.info("In production, bank-user creation routes through the request workflow.")
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Icon name="plus" className="size-4" />
            Add user
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={list.length} />
        <StatCard label="Active" value={active} tone="success" />
        <StatCard
          label="Suspended"
          value={list.filter((u) => u.status === "suspended").length}
          tone="danger"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">Joined</th>
              <th className="px-4 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={statusTone(u.status)} label={u.status} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-[11px] text-muted-foreground">
                  {timeAgo(u.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggle(u.id, u.status)}
                    disabled={u.status === "pending"}
                    className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors disabled:opacity-40 ${
                      u.status === "active"
                        ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                        : "bg-success/15 text-success hover:bg-success/25"
                    }`}
                  >
                    {u.status === "active" ? "Suspend" : "Activate"}
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
