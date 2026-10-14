import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Role } from "@/lib/auth/types";

export interface Suggestion {
  command: string;
  explanation: string;
  changesData: boolean;
}

export type AssistResult =
  | { ok: true; summary: string; suggestions: Suggestion[] }
  | { ok: false; error: string };

const schema = z.object({
  summary: z.string(),
  suggestions: z.array(
    z.object({ command: z.string(), explanation: z.string(), changesData: z.boolean() }),
  ),
});

export const suggestCommands = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string; role: Role }) => {
    const prompt = String(input.prompt ?? "").trim().slice(0, 500);
    if (!prompt) throw new Error("Describe what you want to do.");
    if (!["customer", "bank_admin", "system_admin"].includes(input.role)) throw new Error("Invalid role");
    return { prompt, role: input.role };
  })
  .handler(async ({ data }): Promise<AssistResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI assistant is not configured." };

    const [{ createOpenAI }, { streamText, Output }, { COMMANDS }, { permissionsFor }, { createLovableAiGatewayRunIdFetch }] =
      await Promise.all([
        import("@ai-sdk/openai"),
        import("ai"),
        import("./registry"),
        import("@/lib/auth/permissions"),
        import("./run-id.server"),
      ]);

    // Role permissions are resolved on the server; only these commands are offered.
    const perms = permissionsFor(data.role);
    const allowed = COMMANDS.filter((c) => !c.permission || perms.includes(c.permission));
    const catalog = allowed.map((c) => `- ${c.usage} — ${c.summary}`).join("\n");

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
        instructions: `You translate plain-language banking tasks into commands for the Vantage banking CLI.
The user's role is ${data.role}. Only use commands from this list, with real argument values filled in where the user gave them (use placeholders like <request-id> only when unknown):
${catalog}

Rules: suggest 1-4 commands in the order they should run. Never invent commands outside the list. If the task isn't possible with these commands, return no suggestions and explain why in the summary. Mark changesData true for transfer, request, approve, reject, suspend, activate. Keep explanations under 20 words.`,
        prompt: data.prompt,
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
      const out = await result.output;
      const names = allowed.flatMap((c) => [c.name, ...(c.aliases ?? [])]);
      const suggestions = out.suggestions.filter((s) => {
        const lower = s.command.trim().toLowerCase();
        return names.some((n) => lower === n || lower.startsWith(n + " "));
      });
      return { ok: true, summary: out.summary, suggestions };
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.error("suggestCommands failed", status, err instanceof Error ? err.message : err);
      if (status === 429) return { ok: false, error: "The assistant is busy. Please try again in a moment." };
      if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in Settings → Plans & credits." };
      if (status === 403) return { ok: false, error: "AI access is blocked for this workspace." };
      return { ok: false, error: "The assistant couldn't answer right now." };
    }
  });
