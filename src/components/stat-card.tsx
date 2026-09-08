import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusPill } from "./status-pill";

export function StatCard({
  label,
  value,
  sub,
  tone = "muted",
  live = false,
  bar,
  className,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "success" | "warn" | "danger" | "info" | "muted";
  live?: boolean;
  bar?: number; // 0-100
  className?: string;
  icon?: ReactNode;
}) {
  const barColor =
    tone === "success"
      ? "bg-success"
      : tone === "warn"
        ? "bg-warn"
        : tone === "danger"
          ? "bg-destructive"
          : tone === "info"
            ? "bg-info"
            : "bg-primary";
  return (
    <div
      className={cn(
        "panel-in rounded-xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-mono text-2xl font-semibold tracking-tight">{value}</p>
        {live && <StatusPill tone="info" label="LIVE" live />}
      </div>
      {sub && <p className="mt-1 text-[12px] text-muted-foreground">{sub}</p>}
      {bar !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", barColor)}
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
      )}
    </div>
  );
}
