import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface ReviewInput {
  role: string;
  request: {
    id: string;
    type: string;
    details: string;
    amount?: number;
    requesterName: string;
    createdAt: string;
  };
  requester?: { email: string; status: string; createdAt: string; accountCount: number } | undefined;
  notes?: string;
}

const schema = z.object({
  summary: z.string(),
  missingInfo: z.array(z.string()),
  riskFlags: z.array(z.string()),
  recommendation: z.enum(["approve", "reject", "needs_info"]),
  rationale: z.string(),
});
export type Review = z.infer<typeof schema>;
export type ReviewResult = { ok: true; review: Review } | { ok: false; error: string };

export const reviewRequest = createServerFn({ method: "POST" })
  .validator((input: ReviewInput) => {
    if (input.role !== "bank_admin") throw new Error("Only bank admins can review requests.");
    if (!input.request?.id) throw new Error("Request is required.");
    return {
      ...input,
      notes: String(input.notes ?? "").slice(0, 1000),
      request: { ...input.request, details: String(input.request.details).slice(0, 2000) },
    };
  })
  .handler(async ({ data }): Promise<ReviewResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI review is not configured." };
    const [{ createOpenAI }, { streamText, Output }, { createLovableAiGatewayRunIdFetch }] = await Promise.all([
      import("@ai-sdk/openai"),
      import("ai"),
      import("./cli/run-id.server"),
    ]);
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });
    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions: `You assist a bank admin reviewing a pending customer request (new user, new account, card limit, transfer uplift).
Summarize it in 1-2 plain sentences. List concrete missing information a reviewer would need before deciding (e.g. KYC/ID verification, account currency, purpose, income for limit increases, contact details for new users). List risk flags only if supported by the data. Recommend approve, reject, or needs_info, with a short rationale. Never invent facts not present in the data; the final decision is the admin's.`,
        prompt: JSON.stringify({ request: data.request, requester: data.requester ?? null, adminNotes: data.notes || null }),
        output: Output.object({ schema }),
        maxRetries: 0,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      return { ok: true, review: await result.output };
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.error("reviewRequest failed", status, err instanceof Error ? err.message : err);
      if (status === 429) return { ok: false, error: "The AI reviewer is busy. Try again in a moment." };
      if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in Settings → Plans & credits." };
      if (status === 403) return { ok: false, error: "AI access is blocked for this workspace." };
      return { ok: false, error: "The AI reviewer couldn't answer right now." };
    }
  });
