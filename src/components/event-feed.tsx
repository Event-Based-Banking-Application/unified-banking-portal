import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/mock/api";
import type { EventLevel } from "@/lib/mock/types";
import { formatDateTime } from "@/lib/format";
import { StatusPill } from "./status-pill";

const levelTone: Record<EventLevel, "success" | "warn" | "danger" | "info"> = {
  committed: "success",
  retrying: "warn",
  deadletter: "danger",
  info: "info",
};

const levelLabel: Record<EventLevel, string> = {
  committed: "COMMITTED",
  retrying: "RETRYING",
  deadletter: "DEADLETTER",
  info: "INFO",
};

export function EventFeed({ limit }: { limit?: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api.getEvents(),
  });
  const rows = limit ? (data ?? []).slice(0, limit) : (data ?? []);
  if (isLoading) return <EventFeedSkeleton />;
  return (
    <ul className="divide-y divide-border font-mono text-[12.5px]">
      {rows.map((ev) => (
        <li
          key={ev.id}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
        >
          <span className="shrink-0 text-muted-foreground">{formatDateTime(ev.timestamp)}</span>
          <span className="shrink-0">
            <StatusPill tone={levelTone[ev.level]} label={levelLabel[ev.level]} />
          </span>
          <span className="truncate text-foreground">
            {ev.type} · {ev.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EventFeedSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse bg-muted/30" />
      ))}
    </div>
  );
}

export { StatusPill };
