import { cn } from "@/lib/utils";

type Tone = "success" | "warn" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/12 text-success ring-success/25",
  warn: "bg-warn/12 text-warn ring-warn/25",
  danger: "bg-destructive/12 text-destructive ring-destructive/25",
  info: "bg-info/12 text-info ring-info/25",
  muted: "bg-muted text-muted-foreground ring-border",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          dotClasses[tone],
          live && "live-dot",
        )}
      />
      {label}
    </span>
  );
}
