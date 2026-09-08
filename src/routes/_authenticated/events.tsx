import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mock/api";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EventFeed } from "@/components/event-feed";
import type { EventLevel } from "@/lib/mock/types";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Event stream — Vantage" }] }),
  component: EventsPage,
});

const levelCounts = (rows: { level: EventLevel }[]) => ({
  committed: rows.filter((r) => r.level === "committed").length,
  retrying: rows.filter((r) => r.level === "retrying").length,
  deadletter: rows.filter((r) => r.level === "deadletter").length,
  info: rows.filter((r) => r.level === "info").length,
});

function EventsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.getEvents(),
  });
  const rows = data ?? [];
  const c = levelCounts(rows);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System admin"
        title="Event stream"
        description="Every event committed, retried, or dead-lettered across the core."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Committed" value={c.committed} tone="success" live />
        <StatCard label="Retrying" value={c.retrying} tone="warn" live={c.retrying > 0} />
        <StatCard label="Dead-letter" value={c.deadletter} tone="danger" live={c.deadletter > 0} />
        <StatCard label="Info" value={c.info} tone="info" />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Event log</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {rows.length} events · updated {formatDateTime(new Date().toISOString())}
          </span>
        </div>
        <div className="max-h-[32rem] overflow-y-auto">
          {isLoading ? null : <EventFeed />}
        </div>
      </section>
    </div>
  );
}
