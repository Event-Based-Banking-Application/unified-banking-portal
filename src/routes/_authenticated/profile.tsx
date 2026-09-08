import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { StatusPill } from "@/components/status-pill";
import { Icon } from "@/components/icons";
import { PERMISSION_GROUPS } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vantage" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (!user) return null;

  async function handleSignOut() {
    qc.clear();
    signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your identity, role, and permissions on this platform."
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary/15 text-base font-semibold text-primary">
              {user.avatarInitials}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{user.name}</p>
              <p className="font-mono text-[12px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusPill tone="success" label="Active" />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-mono text-foreground">{user.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Session issued</dt>
              <dd className="font-mono text-foreground">
                {session ? formatDateTime(new Date(session.issuedAt).toISOString()) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Session expires</dt>
              <dd className="font-mono text-foreground">
                {session ? formatDateTime(new Date(session.expiresAt).toISOString()) : "—"}
              </dd>
            </div>
          </dl>
          <button
            onClick={handleSignOut}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Icon name="logout" className="size-4" />
            Sign out
          </button>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Permissions</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            What your role can do. The navigation you see is built from this.
          </p>
          <div className="mt-4 space-y-4">
            {PERMISSION_GROUPS.map((g) => {
              const groupPerms = g.items.filter((i) => user.permissions.includes(i.key));
              if (groupPerms.length === 0) return null;
              return (
                <div key={g.label}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {g.label}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {groupPerms.map((i) => (
                      <span
                        key={i.key}
                        className="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[11px] text-foreground"
                      >
                        {i.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
