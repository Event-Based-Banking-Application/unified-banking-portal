import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icons";
import { StatCard } from "@/components/stat-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arya Banking — Event-Driven Banking Platform" },
      {
        name: "description",
        content:
          "Arya Banking is an event-driven banking platform with role-based access for customers, bank admins, and system admins.",
      },
      { property: "og:title", content: "Arya Banking — Event-Driven Banking Platform" },
      {
        property: "og:description",
        content:
          "Arya Banking is an event-driven banking platform with role-based access for customers, bank admins, and system admins.",
      },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Request access
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success live-dot" />
              Event-driven core · live
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
              Banking that runs on <span className="text-primary">events</span>, not batch jobs.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Arya Banking is an event-driven banking platform. Customers bank, bank admins approve, and
              system operators watch every event flow through the core — all behind a single login
              that adapts to your role.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign in
                <Icon name="arrow-right" className="size-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Request access
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <StatCard
              label="Events processed / day"
              value="1.2B"
              sub="committed, retried, or dead-lettered"
              tone="info"
            />
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="p99 latency" value="42ms" tone="success" />
              <StatCard label="DLQ rate" value="0.03%" tone="warn" />
            </div>
            <div className="rounded-xl border border-border bg-card p-4 font-mono text-[12px]">
              <p className="text-muted-foreground">{"// event stream"}</p>
              <p className="mt-1 text-success">✓ funds.transfer.committed</p>
              <p className="text-success">✓ account.created.committed</p>
              <p className="text-warn">↻ card.limit.retry (2)</p>
              <p className="text-destructive">✗ payment.deadletter</p>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="py-10 lg:py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            One login, three roles
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Everyone signs in on the same page. The interface you get is built from your role and
            permissions.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <RoleCard
              icon="wallet"
              title="Customer"
              desc="View accounts, transfer funds, and raise requests for new accounts or cards — approvals handled by a bank admin."
              points={["Accounts & balances", "Transfers", "Request new account / card"]}
            />
            <RoleCard
              icon="check-square"
              title="Bank admin"
              desc="Approve customer requests, manage customers and bank users, and oversee the banking side of the platform."
              points={["Approve / reject requests", "Manage customers", "Manage bank users"]}
            />
            <RoleCard
              icon="activity"
              title="System admin"
              desc="Watch the event core: service health, the live event stream, and the full audit log."
              points={["Infrastructure console", "Event stream", "Audit log"]}
            />
          </div>
        </section>

      </main>

      <footer className="mt-16 border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-[12px] text-muted-foreground sm:px-6">
          <span>Arya Banking · Event-driven banking</span>
          <span className="font-mono">v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  desc,
  points,
}: {
  icon: string;
  title: string;
  desc: string;
  points: string[];
}) {
  return (
    <div className="panel-in rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name={icon} className="size-4" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <ul className="mt-4 space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-[13px] text-foreground">
            <Icon name="check" className="size-3.5 text-success" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
