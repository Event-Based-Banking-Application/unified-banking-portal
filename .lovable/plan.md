# Command Line for Vantage

## What we're building

A built-in command line that any signed-in user can open from any page. They type plain, friendly commands to get things done without clicking through menus. You only see the commands your role allows.

### How to open it
- Press `/` or `Ctrl/Cmd + K`, or click the existing "Search…" box in the top bar (it becomes the command launcher).
- On phones: a terminal icon button in the top bar.
- Opens as a terminal-style panel docked at the bottom of the screen (monospace, black ink on white, matching the current look). `Esc` closes it.

### Experience
- Prompt shows who you are: `maya@vantage:~$`
- Autocomplete as you type (Tab to finish, arrow keys to pick from suggestions).
- Command history with up/down arrows (kept for the session).
- Results print as neat text tables or status lines; errors explain what went wrong and suggest the right command.
- Actions that change things (transfer, approve, reject, suspend) ask for confirmation: `Type "yes" to confirm`.
- Clickable links in output (e.g. an account id opens its page).

## Commands (user-friendly, word-based)

Everyone:
- `help` — list commands available to you; `help <command>` for details
- `whoami` — your name, role, permissions
- `go <page>` — open a page, e.g. `go accounts`, `go approvals`
- `clear`, `history`, `logout`

Customer:
- `balance` — total and per-account balances
- `accounts` — list your accounts
- `transactions [account]` — recent activity
- `transfer 250 from checking to savings [note "rent"]`
- `request account savings` / `request card-limit 5000` / `request user "Name" email`
- `my requests` — track request status

Bank Admin:
- `pending` — approval queue
- `approve <request-id>` / `reject <request-id> [reason]`
- `customers` — list customers
- `suspend <email>` / `activate <email>`
- `bank users`

System Admin:
- `status` — service health summary
- `services` — full service table
- `events [--level deadletter]` / `tail` — live event stream until `Ctrl+C`
- `audit [--last 20]`

Commands outside your role reply: "You don't have permission to run `approve`."

## Technical details

- `src/lib/cli/` — `parser.ts` (tokenizer with quotes, flags, friendly aliases like "my requests"), `registry.ts` (command definitions: name, aliases, usage, permission, run), `commands/*.ts` per role, all calling the existing mock `api` so data stays in sync with the UI (react-query caches invalidated after mutations).
- `src/components/command-line/` — `CommandLineProvider` (open state, history, global hotkeys, mounted in `AppShell`), `Terminal` panel, `OutputLine` renderers (text, table, link, error).
- Registry filtered by `can(user, permission)` for help and autocomplete.
- Every executed mutating command also writes an audit entry via the existing api.
