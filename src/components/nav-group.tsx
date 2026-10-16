import { Link } from "@tanstack/react-router";
import { Icon } from "./icons";
import type { NavGroupDef } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavGroup({ group }: { group: NavGroupDef }) {
  return (
    <div>
      <p className="px-2 pb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
        {group.label}
      </p>
      <nav className="space-y-0.5">
        {group.items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeProps={{
              className: "bg-primary/10 text-primary",
            }}
            activeOptions={{ exact: false }}
          >
            <Icon
              name={item.icon}
              className="size-4 shrink-0 text-muted-foreground group-[.text-primary]:text-primary"
            />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function NavGroupRail({ groups }: { groups: NavGroupDef[] }) {
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <NavGroup key={g.label} group={g} />
      ))}
    </div>
  );
}

// Utility used elsewhere to compose classnames safely.
export { cn };
