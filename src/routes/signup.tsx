import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Brand } from "@/components/brand";
import { Icon } from "@/components/icons";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Request access — Vantage" },
      {
        name: "description",
        content: "Request access to Vantage, the event-driven banking platform.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signUp(name, email, password);
    setLoading(false);
    if (result.pending) {
      setSubmitted(true);
      toast.success("Request submitted");
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-success/15 text-success">
            <Icon name="check" className="size-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Request received
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A bank administrator will review your access request. You'll receive
            an email at <span className="font-mono text-foreground">{email}</span>{" "}
            once it's approved.
          </p>
          <div className="mt-6">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <Brand />
        </div>
        <h1 className="mt-8 text-center text-2xl font-semibold tracking-tight text-foreground">
          Request access
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          New customers start here. A bank admin approves your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-[12px] font-medium text-foreground">
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Maya Chen"
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
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
              placeholder="you@vantagebank.com"
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[12px] font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Submitting…" : "Submit request"}
            <Icon name="arrow-right" className="size-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
