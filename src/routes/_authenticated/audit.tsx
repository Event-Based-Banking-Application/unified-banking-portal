import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mock/api";
import { formatDateTime, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icons";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit log — Arya Banking" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { data: audit } = useQuery({
    queryKey: ["audit"],
    queryFn: () => api.getAudit(),
  });
  const rows = audit ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System admin"
        title="Audit log"
        description="A tamper-evident trail of who did what, when."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Entries" value={rows.length} tone="info" />
        <StatCard label="Actors" value={new Set(rows.map((r) => r.actor)).size} />
        <StatCard label="Latest" value={rows[0] ? timeAgo(rows[0].timestamp) : "—"} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="Actions will appear here as they happen."
          icon={<Icon name="scroll" className="size-5" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Detail</th>
                <th className="px-4 py-2.5 font-medium">IP</th>
                <th className="px-4 py-2.5 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[12px]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{r.actor}</td>
                  <td className="px-4 py-3 text-foreground">{r.action}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.detail}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.ip}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDateTime(r.timestamp)}
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
