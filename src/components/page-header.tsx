import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
      <div>
        {eyebrow && <p className="eyebrow text-foreground">{eyebrow}</p>}
        <h1 className="font-display mt-2 text-3xl leading-[1.05] text-foreground sm:text-[44px]">
          {title}
        </h1>
        {description && (
          <p className="font-editorial mt-2.5 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
