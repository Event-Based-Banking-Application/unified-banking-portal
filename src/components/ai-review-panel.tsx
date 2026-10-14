import { useState } from "react";
import { reviewRequest, type Review } from "@/lib/review.functions";
import { api } from "@/lib/mock/api";
import { StatusPill } from "./status-pill";
import type { MockRequest } from "@/lib/mock/types";
import { REQUEST_TYPE_LABELS } from "@/lib/mock/types";

const recTone = { approve: "success", reject: "danger", needs_info: "warn" } as const;
const recLabel = { approve: "Suggest approve", reject: "Suggest reject", needs_info: "Needs more info" } as const;

export function AiReviewPanel({
  request,
  onClose,
  onResolve,
}: {
  request: MockRequest;
  onClose: () => void;
  onResolve: (id: string, status: "approved" | "rejected") => void;
}) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const [customers, accounts] = await Promise.all([api.getCustomers(), api.getAccounts(request.requesterId)]);
      const u = customers.find((c) => c.id === request.requesterId);
      const res = await reviewRequest({
        data: {
          role: "bank_admin",
          request: {
            id: request.id,
            type: request.type,
            details: request.details,
            ...(request.amount !== undefined ? { amount: request.amount } : {}),
            requesterName: request.requesterName,
            createdAt: request.createdAt,
          },
          requester: u ? { email: u.email, status: u.status, createdAt: u.createdAt, accountCount: accounts.length } : undefined,
          notes,
        },
      });
      if (res.ok) setReview(res.review);
      else setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed.");
    }
    setLoading(false);
  }

  return (
    <section className="panel-in border border-foreground bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="eyebrow">AI review</p>
          <h2 className="mt-1 text-lg text-foreground">
            {request.id} · {REQUEST_TYPE_LABELS[request.type]} · {request.requesterName}
          </h2>
        </div>
        <button onClick={onClose} className="px-2 text-muted-foreground hover:text-foreground" aria-label="Close review">✕</button>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">“{request.details}”</p>
        <div>
          <label htmlFor="review-notes" className="eyebrow">Extra context (optional)</label>
          <textarea
            id="review-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Customer called in, ID documents received by email"
            className="mt-1.5 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground"
          />
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Reviewing…" : review ? "Review again" : "Summarize & check"}
        </button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {review && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone={recTone[review.recommendation]} label={recLabel[review.recommendation]} />
              <span className="text-[12px] text-muted-foreground">AI suggestion — the decision is yours.</span>
            </div>
            <p className="text-sm text-foreground">{review.summary}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="eyebrow">Missing information</p>
                {review.missingInfo.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                    {review.missingInfo.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-muted-foreground">Nothing obvious missing.</p>}
              </div>
              <div>
                <p className="eyebrow">Risk flags</p>
                {review.riskFlags.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                    {review.riskFlags.map((m) => <li key={m}>{m}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-muted-foreground">None identified.</p>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Why: </span>{review.rationale}</p>
            {request.status === "pending" && (
              <div className="flex gap-2">
                <button onClick={() => onResolve(request.id, "approved")} className="bg-success/15 px-3 py-1.5 text-[13px] font-medium text-success hover:bg-success/25">Approve</button>
                <button onClick={() => onResolve(request.id, "rejected")} className="bg-destructive/15 px-3 py-1.5 text-[13px] font-medium text-destructive hover:bg-destructive/25">Reject</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
