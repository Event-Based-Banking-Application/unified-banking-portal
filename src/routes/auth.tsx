import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icons";
import { toast } from "sonner";
import { MfaStep } from "@/components/mfa-step";
import type { MfaChallenge } from "@/lib/auth/mock-auth";
import { CommandLineProvider, useCommandLine } from "@/components/command-line";

function CliLoginButton() {
  const cli = useCommandLine();
  return (
    <button
      type="button"
      onClick={cli.open}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      {">_"} Sign in with command line
    </button>
  );
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Arya Banking" },
      {
        name: "description",
        content: "Sign in to Arya Banking, the event-driven banking platform.",
      },
    ],
  }),
  component: () => (
    <CommandLineProvider>
      <AuthPage />
    </CommandLineProvider>
  ),
});

function AuthPage() {
  const { startSignIn } = useAuth();
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      setChallenge(await startSignIn(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  function quickFill(e: string) {
    setEmail(e);
    setPassword("demo1234");
  }

  if (challenge)
    return (
      <MfaStep
        challenge={challenge}
        onChallenge={setChallenge}
        onCancel={() => setChallenge(null)}
        onDone={() => {
          toast.success("Signed in");
          navigate({ to: "/dashboard", replace: true });
        }}
      />
    );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <Brand size="md" />
        <div className="max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Event-driven banking
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-foreground">
            One platform.
            <br />
            Three roles. <span className="text-primary">One login.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Customers, bank admins, and system operators all sign in here. The interface you get is
            shaped by your role and permissions — nothing you don't need, nothing you shouldn't see.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 font-mono text-[11px]">
            <Metric label="Events / sec" value="14.2k" />
            <Metric label="Uptime" value="99.98%" />
            <Metric label="DLQ p95" value="42ms" />
          </div>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground/60">
          Arya Banking · SOC2 Type II
        </p>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-background px-4 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Brand />
          </div>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground lg:mt-0">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your Arya Banking credentials or continue with SSO.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-[12px] font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aryabanking.com"
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[12px] font-medium text-foreground">
                  Password
                </label>
                <button type="button" className="text-[12px] text-primary hover:underline">
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
              <Icon name="arrow-right" className="size-4" />
            </button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-[11px] text-muted-foreground">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast.info("SSO is mocked in this demo.")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Icon name="shield" className="size-4 text-muted-foreground" />
              Continue with SSO
            </button>
            <CliLoginButton />
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
