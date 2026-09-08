import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mock/api";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { EventFeed } from "@/components/event-feed";
import {
  SERVICE_STATUS_LABELS,
  type ServiceStatus,
} from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/console")({
  head: () => ({ meta: [{ title: "Console — Vantage" }] }),
  component: ConsolePage,
});

const svcTone: Record<ServiceStatus, "success" | "warn" | "danger"> = {
  healthy: "success",
  degraded: "warn",
  alert: "danger",
};

function ConsolePage() {
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: () => api.getServices(),
  });
  const list = services ?? [];
  const healthy = list.filter((s) => s.status === "healthy").length;
  const avgLatency = list.length
    ? Math.round(list.reduce((s, x) => s + x.latencyMs, 0) / list.length)
    : 0;
  const totalDepth = list.reduce((s, x) => s + x.depth, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System admin"
        title="Infrastructure console"
        description="Live health of the event-driven core services."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Healthy" value={`${healthy}/${list.length}`} tone="success" live />
        <StatCard label="Avg latency" value={`${avgLatency}ms`} tone="info" />
        <StatCard label="Queue depth" value={totalDepth} tone={totalDepth > 100 ? "warn" : "muted"} />
        <StatCard label="Min uptime" value={`${Math.min(...list.map((s) => s.uptimePct), 100)}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Services</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Service</th>
                <th className="px-4 py-2.5 font-medium">Region</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Latency</th>
                <th className="px-4 py-2.5 text-right font-medium">Depth</th>
                <th className="px-4 py-2.5 text-right font-medium">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">{s.region}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={svcTone[s.status]} label={SERVICE_STATUS_LABELS[s.status]} live={s.status !== "healthy"} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{s.latencyMs}ms</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{s.depth}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{s.uptimePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Live event stream</h2>
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            <EventFeed />
          </div>
        </section>
      </div>
    </div>
  );
}
