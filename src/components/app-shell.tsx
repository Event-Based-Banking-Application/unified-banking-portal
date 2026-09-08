import { useState } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { NAV_GROUPS } from "@/lib/nav";
import { NavGroupRail } from "./nav-group";
import { Brand } from "./brand";
import { RoleBadge } from "./role-badge";
import { Icon } from "./icons";

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => user?.permissions.includes(i.permission)),
  })).filter((g) => g.items.length > 0);

  async function handleSignOut() {
    signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="border-b border-border px-4 py-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavGroupRail groups={visibleGroups} />
        </div>
        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon name="logout" className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile rail */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-sidebar">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              >
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavGroupRail groups={visibleGroups} />
            </div>
            <div className="border-t border-border p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon name="logout" className="size-4" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
              >
                <Icon name="menu" className="size-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                  {user?.avatarInitials}
                </div>
                <div className="leading-none">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              {user && <RoleBadge role={user.role} />}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-muted-foreground sm:flex">
                <Icon name="search" className="size-4" />
                <span className="text-[12px]">Search…</span>
                <span className="ml-3 rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
                  /
                </span>
              </div>
              <button className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted">
                <Icon name="bell" className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-warn" />
              </button>
              <Link
                to="/profile"
                className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted"
              >
                <Icon name="user" className="size-4" />
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

import { NavGroupRail } from "./nav-group";
