import { ROLE_LABELS, ROLE_TONES, type Role } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset",
        ROLE_TONES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
