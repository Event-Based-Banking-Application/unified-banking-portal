import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { available, parse, resolve, type Line } from "@/lib/cli/registry";
import { DEMO_CREDENTIALS } from "@/lib/mock/seed";

interface Entry { prompt?: string; lines: Line[] }
const Ctx = createContext<{ open: () => void } | null>(null);
export const useCommandLine = () => useContext(Ctx)!;

export function CommandLineProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName ?? "");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {isOpen && <Terminal onClose={() => setOpen(false)} />}
    </Ctx.Provider>
  );
}

const toneCls = { muted: "text-muted-foreground", ok: "text-success", warn: "text-warn", error: "text-destructive" } as const;

function OutputLine({ line, onLink, onPick }: { line: Line; onLink: () => void; onPick: (cmd: string) => void }) {
  if (line.kind === "suggest")
    return (
      <button onClick={() => onPick(line.command)} className="my-1 block w-full max-w-2xl border border-border px-3 py-2 text-left hover:border-foreground">
        <div className="flex items-center justify-between gap-3">
          <span className="text-foreground">$ {line.command}</span>
          <span className={`shrink-0 text-[10px] uppercase tracking-wider ${line.changesData ? "text-warn" : "text-success"}`}>
            {line.changesData ? "changes data · confirm" : "read only"}
          </span>
        </div>
        <div className="mt-0.5 text-muted-foreground">{line.explanation}</div>
      </button>
    );
  if (line.kind === "link")
    return <Link to={line.to} onClick={onLink} className="block text-primary underline underline-offset-2 hover:text-foreground">↳ {line.text}</Link>;
  if (line.kind === "table")
    return (
      <div className="my-1 overflow-x-auto">
        <table className="text-left">
          <thead><tr>{line.head.map((h) => <th key={h} className="pr-6 pb-0.5 font-medium uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead>
          <tbody>{line.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="whitespace-nowrap pr-6 text-foreground">{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  return <div className={`whitespace-pre-wrap ${line.tone ? toneCls[line.tone] : "text-foreground"}`}>{line.text}</div>;
}

function Terminal({ onClose }: { onClose: () => void }) {
  const { user, signOut, signIn } = useAuth();
  const [loginEmail, setLoginEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<Entry[]>([{ lines: [{ kind: "text", text: 'Vantage CLI — type "help", or "ask" + a plain-language task.', tone: "muted" }] }]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const pending = useRef<(() => Promise<Line[]>) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [busy]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [entries]);

  const prompt = `${user?.email.split("@")[0] ?? "guest"}@vantage:~$`;
  useEffect(() => { if (!user) setEntries([{ lines: [{ kind: "text", tone: "muted", text: 'Vantage CLI — type "login <email>" to sign in, or "demo" for demo accounts.' }] }]); }, [user]);
  const cmds = user ? available(user) : [];
  const suggestions = value.trim() && !pending.current
    ? cmds.flatMap((c) => [c.name, ...(c.aliases ?? [])]).filter((n) => n.startsWith(value.trim().toLowerCase()) && n !== value.trim().toLowerCase()).slice(0, 6)
    : [];

  const print = (e: Entry) => setEntries((x) => [...x, e]);

  const guest = async (input: string) => {
    const err = (text: string): Line => ({ kind: "text", tone: "error", text });
    const muted = (text: string): Line => ({ kind: "text", tone: "muted", text });
    if (loginEmail) {
      const email = loginEmail;
      setLoginEmail(null);
      print({ prompt: "********", lines: [] });
      setBusy(true);
      try {
        const s = await signIn(email, input);
        print({ lines: [{ kind: "text", tone: "ok", text: `✓ Signed in as ${s.user.name}. Type "help" to see your commands.` }] });
        navigate({ to: "/dashboard", replace: true });
      } catch (e) { print({ lines: [err(e instanceof Error ? e.message : "Sign-in failed.")] }); }
      setBusy(false);
      return;
    }
    const [cmd, ...args] = input.split(/\s+/);
    switch ((cmd ?? "").toLowerCase()) {
      case "": return print({ prompt: "", lines: [] });
      case "help":
        return print({ prompt: input, lines: [
          muted("You're not signed in. Available commands:"),
          { kind: "table", head: ["Command", "What it does"], rows: [
            ["login <email>", "Sign in (you'll be asked for your password)"],
            ["demo", "List demo accounts"],
            ["signup", "Open the request-access page"],
            ["clear", "Clear the screen"],
          ] },
        ] });
      case "login": case "signin": {
        const email = args[0];
        if (!email) return print({ prompt: input, lines: [err("Usage: login you@vantagebank.com")] });
        setLoginEmail(email);
        return print({ prompt: input, lines: [muted(`Password for ${email}:`)] });
      }
      case "demo":
        return print({ prompt: input, lines: [{ kind: "table", head: ["Role", "Email", "Password"], rows: DEMO_CREDENTIALS.map((c) => [String(c.role), c.email, c.password]) }] });
      case "signup": navigate({ to: "/signup" }); onClose(); return;
      case "clear": return setEntries([]);
      default: return print({ prompt: input, lines: [err(`Sign in first: "login <email>". Type "help" for options.`)] });
    }
  };

  const run = useCallback(async (raw: string) => {
    const input = raw.trim();
    if (!user) return guest(input);
    if (pending.current) {
      const action = pending.current;
      pending.current = null;
      if (/^y(es)?$/i.test(input)) {
        print({ prompt: input, lines: [] });
        setBusy(true);
        try { print({ lines: await action() }); }
        catch (err) { print({ lines: [{ kind: "text", tone: "error", text: err instanceof Error ? err.message : "Failed." }] }); }
        setBusy(false);
      } else print({ prompt: input, lines: [{ kind: "text", text: "Cancelled.", tone: "muted" }] });
      return;
    }
    if (!input) return print({ prompt: "", lines: [] });
    if (!loginEmail) setHistory((h) => [...h, input]);
    const match = resolve(input);
    if (!match) return print({ prompt: input, lines: [{ kind: "text", tone: "error", text: `Unknown command "${input.split(" ")[0]}". Type "help".` }] });
    const { cmd, rest } = match;
    if (cmd.permission && !user.permissions.includes(cmd.permission))
      return print({ prompt: input, lines: [{ kind: "text", tone: "error", text: `You don't have permission to run "${cmd.name}".` }] });
    let cleared = false;
    const { args, flags } = parse(rest);
    setBusy(true);
    try {
      const lines = await cmd.run({
        user, args, flags, queryClient, history,
        navigate: (to) => navigate({ to }),
        signOut: () => { signOut(); onClose(); navigate({ to: "/auth", replace: true }); },
        clear: () => { cleared = true; },
        confirm: (q, action) => { pending.current = action; return [{ kind: "text", tone: "warn", text: `${q} Type "yes" to confirm.` }]; },
      });
      if (cleared) setEntries([]); else print({ prompt: input, lines });
    } catch (err) {
      print({ prompt: input, lines: [{ kind: "text", tone: "error", text: err instanceof Error ? err.message : "Command failed." }] });
    }
    setBusy(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, queryClient, history, navigate, signOut, onClose, loginEmail]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") onClose();
    else if (e.key === "Enter") { const v = value; setValue(""); setHIdx(-1); void run(v); }
    else if (e.key === "Tab") { e.preventDefault(); if (suggestions[0]) setValue(suggestions[0] + " "); }
    else if (e.key === "ArrowUp" && history.length) { e.preventDefault(); const i = hIdx < 0 ? history.length - 1 : Math.max(0, hIdx - 1); setHIdx(i); setValue(history[i]!); }
    else if (e.key === "ArrowDown" && hIdx >= 0) { e.preventDefault(); const i = hIdx + 1; if (i >= history.length) { setHIdx(-1); setValue(""); } else { setHIdx(i); setValue(history[i]!); } }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-[55vh] flex-col border-t-2 border-foreground bg-background font-mono text-[12.5px] shadow-2xl" role="dialog" aria-label="Command line">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="eyebrow">Command line</span>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">Tab complete · ↑↓ history · Esc close</span>
          <button onClick={onClose} className="px-1.5 hover:text-foreground" aria-label="Close command line">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3" onClick={() => inputRef.current?.focus()}>
        {entries.map((e, i) => (
          <div key={i} className="mb-1">
            {e.prompt !== undefined && <div><span className="text-primary">{prompt}</span> <span className="text-foreground">{e.prompt}</span></div>}
            {e.lines.map((l, j) => <OutputLine key={j} line={l} onLink={onClose} onPick={(c) => { setValue(c); inputRef.current?.focus(); }} />)}
          </div>
        ))}
        {busy && <div className="text-muted-foreground">…</div>}
        <div ref={bottomRef} />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => { setValue(s + " "); inputRef.current?.focus(); }} className="border border-border px-1.5 text-muted-foreground hover:border-foreground hover:text-foreground">{s}</button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <span className="shrink-0 text-primary">{loginEmail ? "password:" : pending.current ? "confirm>" : prompt}</span>
        <input
          ref={inputRef}
          value={value}
          type={loginEmail ? "password" : "text"}
          disabled={busy}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
          autoComplete="off"
          spellCheck={false}
          aria-label="Command"
          placeholder={busy ? "" : 'try "help"'}
        />
      </div>
    </div>
  );
}
