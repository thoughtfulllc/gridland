# Subprocess Safety

**When this loads:** You are touching any file under `packages/create-gridland/`, or adding new code that spawns an external process from anywhere in the monorepo.

## The Rule

When any element of a subprocess command comes from untrusted input (CLI args, environment variables, file contents, network data, user-supplied config), use `spawnSync` or `execFileSync` from `node:child_process` with an **argv array**. Never use the `execSync` family with a template-literal command string that interpolates untrusted input.

## Why

`spawnSync(file, args)` and `execFileSync(file, args)` default to `shell: false`. The OS syscall (`execve` on POSIX, `CreateProcess` on Windows) receives each array element as one `argv` position, byte for byte. Shell metacharacters — `;`, `&&`, `|`, backticks, dollar-paren, glob stars, redirects — are just bytes in a string. They cannot be interpreted as commands.

The template-literal string form hands the entire string to `/bin/sh -c` (or `cmd.exe /d /s /c` on Windows). The shell parses every metacharacter. A user-supplied fragment like `foo; rm -rf ~` becomes two commands.

**Concrete difference, described (no literal bad call shown):**

- Dangerous shape: build a command string via template literal (`` `npx shadcn@latest add @gridland/${userComponent}` ``) and pass the full string to `execSync`. With `userComponent = "spinner; rm -rf ~"`, the shell splits on `;` and runs `rm -rf ~`.
- Safe shape: build an argv array (`["shadcn@latest", "add", `@gridland/${userComponent}`]`) and pass it along with the executable name (`"npx"`) to `spawnSync`. With the same malicious input, shadcn receives one literal package name and fails with "package not found." No shell ever sees the semicolon.

The argv form is shorter, clearer, and safer. There is no downside to using it.

## Canonical Example in Gridland

`packages/create-gridland/src/index.ts` — the `add` subcommand. It composes a `dlx` prefix (`["npx"]`, `["bunx"]`, `["pnpm", "dlx"]`, or `["yarn", "dlx"]` depending on the detected package manager) with the shadcn invocation and user-supplied component names, then spawns via `spawnSync`:

```ts
const [dlxFile, ...dlxPrefix] = getDlxCommand(detectPackageManager())
const args = [...dlxPrefix, "shadcn@latest", "add", ...names, ...flags]
spawnSync(dlxFile, args, { cwd: opts.cwd ?? process.cwd(), stdio: "inherit" })
```

Every element of `args` — including `names`, which originate from the user's CLI argv — is passed as a distinct `argv` position. Shell metacharacters in a component name are literally impossible to interpret because no shell is involved.

## Commander Gotcha (read this if you're adding a subcommand)

Commander v13 by default parses root-level options even when dispatching to a subcommand. If the root command and a subcommand both define the same option name (e.g. both have `--yes`), the root parser consumes the flag before the subcommand's action sees it. The subcommand's `opts` object comes back missing the flag, silently.

**Fix:** call `program.enablePositionalOptions()` once at the top of the Command definition. With this, Commander stops walking the root's option table as soon as it hits a subcommand name; the subcommand parser gets full control of everything after.

See `packages/create-gridland/src/index.ts` — the line immediately after `const program = new Command()` — for the canonical fix. If you add a new subcommand and find that a shared option isn't making it into your action handler, this is almost certainly why.

## How to Test

Inject a shell metacharacter through the user-input path, run with a dry-run or against a benign command, and grep the output for the literal payload:

```bash
# The payload must appear as ONE literal string in the output.
# If "PWNED_FROM_SHELL" appears on its own line, the shell interpreted the ;
bun packages/create-gridland/dist/index.js add 'safe; echo PWNED_FROM_SHELL' --dry-run
```

Expected: the literal string `safe; echo PWNED_FROM_SHELL` appears in the output as one argv position. `PWNED_FROM_SHELL` never appears on its own line.

For real spawns (non-dry-run), the same test works — run it against a command that will reject the bad input (like shadcn rejecting an unknown package) and verify no shell interpretation happened.

## Anti-Patterns

- Building a command string with a template literal that interpolates user input, then handing it to `execSync` or async `exec`. The shell will parse it.
- Passing `shell: true` to `spawnSync` when any element of `args` is user input. This explicitly enables the shell and defeats the whole safety model.
- Shell-quoting user input by hand with regex. Shell quoting rules are extremely subtle and platform-dependent; don't try. Use argv arrays.
- Building a command string to display to the user *and* reusing that same string for execution. Do the display via `console.log` but use `spawnSync(file, args)` with an argv array for the actual execution.

## Background

The `make-it-better` branch added the `create-gridland add` subcommand. The original draft built a command string with a template literal and handed it to `execSync`; a security hook correctly flagged it. The fix was to switch to `spawnSync` with an argv array, and the Commander option-collision bug surfaced during verification of the fix. Both are documented on the Notion page *Registry pipeline refactor + create-gridland add — what shipped on make-it-better* under §2.4 and §2.5.
