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
    <div className={cn("panel-in border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-display text-[34px] leading-none tracking-tight tabular-nums">{value}</p>
        {live && <StatusPill tone="info" label="LIVE" live />}
      </div>
      {sub && <p className="font-editorial mt-2 text-[13px] text-muted-foreground">{sub}</p>}
      {bar !== undefined && (
        <div className="mt-3 h-1 overflow-hidden bg-muted">
          <div
            className={cn("h-full", barColor)}
            style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
          />
        </div>
      )}
    </div>
  );
}
