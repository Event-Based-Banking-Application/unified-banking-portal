import { useEffect, useState } from "react";
import type { MfaChallenge } from "@/lib/auth/mock-auth";
import { useAuth } from "@/lib/auth/auth-context";
import { ROLE_LABELS } from "@/lib/auth/types";
import { Brand } from "./brand";

export function MfaStep({
  challenge,
  onChallenge,
  onDone,
  onCancel,
}: {
  challenge: MfaChallenge;
  onChallenge: (c: MfaChallenge) => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { verifyMfa, resendMfa } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { setCode(""); setError(null); }, [challenge.id]);

  const secs = Math.max(0, Math.round((challenge.expiresAt - now) / 1000));
  const admin = challenge.role !== "customer";
  const isTotp = challenge.method === "totp";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await verifyMfa(challenge.id, code);
      if (res.done) onDone();
      else onChallenge(res.challenge);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setError(msg);
      if (/expired|locked|sign in again/i.test(msg)) setTimeout(onCancel, 1800);
    }
    setLoading(false);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Brand size="md" />
        <p className="eyebrow mt-8">
          Step {challenge.step} of {challenge.totalSteps} · {ROLE_LABELS[challenge.role]}
        </p>
        <h1 className="font-display mt-2 text-3xl text-foreground">
          {isTotp ? "Authenticator code" : "Email verification"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code from {challenge.maskedDestination}.
        </p>
        {admin && (
          <p className="mt-3 border border-warn/40 bg-warn/10 px-3 py-2 text-[12px] text-foreground">
            Admin accounts need two factors (authenticator app + email), codes expire in 2 minutes, and 3 wrong tries lock the account for 15 minutes.
          </p>
        )}
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-label="Verification code"
            className="w-full border border-border bg-card px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-foreground outline-none focus:border-foreground"
            placeholder="••••••"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            disabled={loading || code.length !== 6 || secs === 0}
            className="w-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Verifying…" : challenge.step < challenge.totalSteps ? "Verify & continue" : "Verify & sign in"}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="font-mono">{secs > 0 ? `Expires in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : "Code expired"}</span>
          <div className="flex gap-3">
            <button type="button" onClick={async () => onChallenge(await resendMfa(challenge.id))} className="hover:text-foreground">
              {isTotp ? "Refresh code" : "Resend code"}
            </button>
            <button type="button" onClick={onCancel} className="hover:text-foreground">Cancel</button>
          </div>
        </div>
        <p className="mt-6 border border-dashed border-border px-3 py-2 font-mono text-[12px] text-muted-foreground">
          Demo mode — your code: <span className="text-foreground">{challenge.demoCode}</span>
        </p>
      </div>
    </div>
  );
}
