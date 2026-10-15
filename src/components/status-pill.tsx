import { cn } from "@/lib/utils";

type Tone = "success" | "warn" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  success: "text-success ring-success/40",
  warn: "text-warn ring-warn/40",
  danger: "text-destructive ring-destructive/40",
  info: "text-info ring-info/40",
  muted: "text-muted-foreground ring-border",
};

const dotClasses: Record<Tone, string> = {
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-destructive",
  info: "bg-info",
  muted: "bg-muted-foreground",
};

export function StatusPill({
  tone,
  label,
  live = false,
  className,
}: {
  tone: Tone;
  label: string;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      <span className={cn("size-1.5", dotClasses[tone], live && "live-dot")} />
      {label}
    </span>
  );
}
