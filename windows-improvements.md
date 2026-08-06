# Windows Improvements

This repository is a Windows-focused fork of
[PrimeIntellect-ai/prime-agent](https://github.com/PrimeIntellect-ai/prime-agent).
This file tracks the compatibility and usability improvements maintained by the
fork to make Prime Agent run better on native Windows. Each entry documents a
specific fix, the files it touched, and how to verify it.

---

## How to add an entry (for future agents)

Whenever you make a change that improves Windows support, add an entry here so the
history stays complete. Follow these steps:

1. **Copy the template** below (the `## Template` section).
2. **Fill it in** with the date, a short title, the problem, the fix, the files
   changed, and how to verify it.
3. **Insert it at the top** of the `## Improvements` section, directly under the
   `## Improvements` heading — newest entries go first.
4. **Keep it concise and factual.** One entry per change. Use plain language; no
   fluff.

### When to add an entry

Add an entry whenever you:
- Fix a Windows-specific bug (paths, fsync, process spawning, console windows, etc.)
- Add Windows-specific handling or platform guards (`process.platform === "win32"`)
- Change behavior that only affects Windows users
- Update the installed copy's compiled bundles to match a source fix

### Example

Here is a completed example showing the expected format:

```markdown
### 2026-08-05 — Fix kernel bootstrap venv Python path on Windows

**Problem:** The kernel bootstrap hardcoded the POSIX venv Python path
(`bin/python`), which does not exist on Windows. A uv-created venv on Windows
places its interpreter at `Scripts\python.exe`.

**Fix:** Added a `venvPythonPath()` helper that resolves the interpreter per
platform (`Scripts\python.exe` on win32, `bin/python` elsewhere).

**Files:**
- `packages/coding-agent/src/core/kernel/bootstrap.ts` — added `venvPythonPath()`
  and replaced the hardcoded `bin/python` paths

**Verify:** Run the kernel bootstrap; it should resolve to
`~/.prime/agent/kernel-venv/Scripts/python.exe` on Windows.
```

---

## Template

```markdown
### YYYY-MM-DD — Short title

**Problem:** What was broken or suboptimal on Windows.

**Fix:** What was changed and why.

**Files:**
- `path/to/file.ts` — what changed

**Verify:** How to confirm the fix works on Windows.
```

---

## Improvements

### 2026-08-05 — Hide remaining chat and agent helper processes

**Problem:** Starting a chat or agent could briefly flash a PowerShell or console
window because catalog, owned-worker, session-lease, Git, shell, and managed-tool
probes still launched visible Windows child processes.

**Fix:** Added `windowsHide: true` to the remaining background process launches
used by normal chat startup and agent creation.

**Files:**
- `packages/coding-agent/src/modes/daemon/daemon-catalog-process.ts` — hid the
  persistent catalog helper
- `packages/coding-agent/src/cli/owned-session-worker.ts` — hid isolated session
  workers
- `packages/coding-agent/src/core/session-lease.ts` — hid PowerShell process
  identity queries
- `packages/coding-agent/src/core/footer-data-provider.ts` — hid Git branch
  probes
- `packages/coding-agent/src/config.ts` — hid package-manager discovery probes
- `packages/coding-agent/src/utils/git.ts` — hid Git context probes
- `packages/coding-agent/src/utils/shell.ts` — hid shell discovery probes
- `packages/coding-agent/src/utils/tools-manager.ts` — hid managed-tool probes
  and extraction

**Verify:** Start a fresh chat, launch agents, and send messages on Windows; no
PowerShell or console windows should flash.

### 2026-08-05 — Report Windows session paths to Herdr

**Problem:** Herdr accepted session file references only when they began with
`/`, so absolute Windows paths were omitted from lifecycle reports.

**Fix:** Replaced the POSIX prefix check with the platform-aware absolute path
check from Node.js.

**Files:**
- `packages/coding-agent/src/core/extensions/builtin/herdr-agent-state.ts` —
  accepted Windows absolute session paths

**Verify:** Start Prime Agent from a Herdr pane on Windows and confirm lifecycle
reports include `agent_session_path` with the session's drive-letter path.

### 2026-08-05 — Use Windows AppData directories for fresh installs

**Problem:** Configuration, logs, tools, sessions, and kernel environments used
POSIX-style dot directories under `%USERPROFILE%` on Windows.

**Fix:** Fresh installs now use `%APPDATA%\Prime Agent` for roaming
configuration and `%LOCALAPPDATA%\Prime Agent` for machine-local data. Existing
`.prime\agent` installs and explicit directory overrides remain in place.

**Files:**
- `packages/coding-agent/src/config.ts` — split fresh Windows configuration and
  local-data defaults while preserving legacy installs
- `packages/coding-agent/src/core/kernel/bootstrap.ts` — placed fresh Windows
  kernel environments and their fallback under local AppData

**Verify:** On a Windows profile without `.prime\agent`, start Prime Agent and
confirm settings are created under `%APPDATA%\Prime Agent` while logs, tools,
sessions, and `kernel-venv` use `%LOCALAPPDATA%\Prime Agent`.

### 2026-08-05 — Stage release files without POSIX shell quoting

**Problem:** The release script single-quoted file names for a POSIX shell even
though Node uses `cmd.exe` by default on Windows.

**Fix:** Release staging now invokes Git directly with an argument array, so
spaces and shell-sensitive characters are passed without shell parsing.

**Files:**
- `scripts/release.mjs` — replaced constructed `git add` commands with
  `execFileSync()` argument arrays

**Verify:** Run the release staging flow with a changed file whose path contains
spaces and confirm Git stages the exact file on Windows.

### 2026-08-05 — Run installer checks with Git Bash on Windows

**Problem:** The mandatory installer render check directly spawned `sh`, which
is absent from a normal Windows Node environment.

**Fix:** The check now resolves configured, per-user, system, or `PATH` Git Bash
installations. If no POSIX shell exists, it skips only the shell-installer render
check with a clear diagnostic.

**Files:**
- `scripts/check-installer-render.mjs` — added Windows shell discovery and a
  clear no-shell skip

**Verify:** Run `npm run check` on Windows with Git Bash outside `PATH`, then on
a machine without a POSIX shell; the installer check should run in the first
case and explicitly skip in the second.

### 2026-08-05 — Parse quoted Windows editor commands

**Problem:** External editor commands were split on spaces, breaking quoted
executable paths such as Visual Studio Code under `Program Files`.

**Fix:** Added shared Windows command-line parsing and now launch the parsed
executable and arguments directly without a shell.

**Files:**
- `packages/coding-agent/src/utils/editor-command.ts` — added Windows and POSIX
  editor command parsing
- `packages/coding-agent/src/modes/interactive/interactive-mode.ts` — used the
  shared parsed launch command
- `packages/coding-agent/src/modes/interactive/components/extension-editor.ts`
  — used the shared parsed launch command

**Verify:** Set `$EDITOR` to
`"C:\Program Files\Microsoft VS Code\Code.exe" --wait` and open either external
editor; Code should receive the temporary file path.

### 2026-08-05 — Move deleted sessions to the Windows Recycle Bin

**Problem:** Session deletion depended on an external `trash` executable. When
it was missing on Windows, the session file was permanently unlinked.

**Fix:** Added the cross-platform `trash` library and removed automatic permanent
deletion fallback. If recycling fails, the session and its artifacts remain
unchanged and an error is returned.

**Files:**
- `packages/coding-agent/src/core/session-file-actions.ts` — moved session files
  through the platform recycle API without an unlink fallback
- `packages/coding-agent/package.json` — added the `trash` runtime dependency

**Verify:** Delete a saved session on Windows and restore it from the Recycle
Bin. Simulate a recycle failure and confirm the session and artifacts remain.

### 2026-08-05 — Detect per-user Git Bash installations

**Problem:** Git Bash discovery checked system installations and `PATH`, but not
per-user Git for Windows locations under `%LOCALAPPDATA%`.

**Fix:** Added both `%LOCALAPPDATA%\Programs\Git\bin\bash.exe` and
`%LOCALAPPDATA%\Git\bin\bash.exe` to discovery and error diagnostics.

**Files:**
- `packages/coding-agent/src/utils/shell.ts` — added per-user Git Bash candidates

**Verify:** Install Git for Windows per-user without adding it to `PATH`; the
Bash tool should resolve the user-local `bash.exe`.

### 2026-08-05 — Compare Windows resource paths case-insensitively

**Problem:** Resource identity and containment checks compared path strings with
case-sensitive equality and prefix checks. Equivalent Windows paths with different
drive or directory casing could be loaded twice or assigned the wrong scope.

**Fix:** Added canonical comparison and containment helpers that use native real
paths, case-fold on Windows, and use `path.relative()` to preserve directory
boundaries. Resource loading and prompt-template scope checks now share them.

**Files:**
- `packages/coding-agent/src/utils/paths.ts` — added canonical comparison and
  containment helpers
- `packages/coding-agent/src/core/resource-loader.ts` — used the shared helpers
  for resource identity, metadata lookup, and scope detection
- `packages/coding-agent/src/core/prompt-templates.ts` — used the shared helper
  for prompt scope detection

**Verify:** Load the same resource through paths with different drive-letter or
directory casing and confirm it is loaded once with the correct user or project
scope.

### 2026-08-05 — Hide detached daemon console windows

**Problem:** Detached daemon supervisors, workers, replacements, and update
coordinators could open visible console windows when spawned on Windows.

**Fix:** Added shared detached CLI spawn options with `windowsHide: true` and
applied them to every detached daemon-related spawn.

**Files:**
- `packages/coding-agent/src/cli/subprocess-launch.ts` — added shared hidden
  detached spawn options
- `packages/coding-agent/src/cli/daemon-launch.ts` — hid daemon startup
- `packages/coding-agent/src/cli/daemon-command.ts` — hid background sessions
- `packages/coding-agent/src/cli/daemon-update-restart.ts` — hid update
  coordinators
- `packages/coding-agent/src/modes/daemon/daemon-mode.ts` — hid replacement
  supervisors
- `packages/coding-agent/src/modes/daemon/daemon-supervisor.ts` — hid workers and
  replacement supervisors
- `packages/coding-agent/src/utils/shell.ts` — reused the hidden synchronous
  process-tree termination helper

**Verify:** Start, restart, update, and stop background daemon sessions on Windows
and confirm no console window flashes.

### 2026-08-05 — Complete Windows paths in file autocomplete

**Problem:** File autocomplete treated only `/` as a natural path separator,
joined absolute drive-letter paths beneath the working directory, and did not
expand `~\` home paths.

**Fix:** Made path detection separator-aware, used `path.isAbsolute()`,
`path.parse().root`, and `path.resolve()` for filesystem operations, accepted
both home path separator forms, and normalized separators only for display.

**Files:**
- `packages/tui/src/autocomplete.ts` — added Windows-aware path extraction,
  resolution, home expansion, and display formatting

**Verify:** Complete `C:\path\to\fi` and `~\path\to\fi` on Windows and confirm
the matching file is suggested using `/` separators for display.

### 2026-08-05 — Terminate cancelled command process trees on Windows

**Problem:** Cancelling or timing out a command killed only its immediate process
on Windows, allowing descendant processes started by extensions or tools to keep
running.

**Fix:** Changed the shared process signaling helper to use hidden `taskkill /T`
on Windows and force-escalate with `/F /T`. Command execution now uses the shared
helper for both graceful cancellation and forced cleanup.

**Files:**
- `packages/coding-agent/src/utils/child-process.ts` — added Windows tree
  termination and forced escalation
- `packages/coding-agent/src/core/exec.ts` — routed cancellation through the
  shared process-tree helper

**Verify:** Start a command that launches a long-running child, cancel the
command, and confirm both processes exit without a console window appearing.

---

### 2026-08-05 — Discover Windows daemons through named pipes and owner records

**Problem:** Daemon discovery returned no listener or socket-directory candidates
on Windows, so an idle daemon on the default named pipe was invisible. Custom
named pipes were also invisible unless a worker descriptor referenced them.

**Fix:** Always probes the default named pipe, adds durable supervisor owner
records as custom candidates, and normalizes Windows pipe names to lowercase.
Unreachable default probes without supporting state are omitted.

**Files:**
- `packages/coding-agent/src/cli/daemon-ps.ts` — added default and owner-record
  candidates with case-insensitive pipe normalization
- `packages/coding-agent/src/modes/daemon/daemon-supervisor-ownership.ts` —
  exposed durable owner records for discovery

**Verify:** Start an idle daemon on the default or a custom named pipe, then run
`prime-agent ps`; the daemon should be listed and available to reap or shutdown.

---

### 2026-08-05 — Install uv automatically during Windows kernel bootstrap

**Problem:** Kernel bootstrap tried to install missing `uv` with `sh` and `curl`,
which fails on Windows systems without Unix shell tools.

**Fix:** Added the official PowerShell installer on Windows and probes `PATH`,
the standalone install directory, WinGet links, Scoop shims, and Cargo binaries.
Installation hints and failures now show the platform-specific command and paths.

**Files:**
- `packages/coding-agent/src/core/kernel/bootstrap.ts` — added Windows installer
  selection and executable discovery

**Verify:** On Windows without `uv` on `PATH`, set
`PRIME_AGENT_INSTALL_UV=1` and start the kernel; `uv.exe` should install and the
kernel bootstrap should continue.

---

### 2026-08-05 — Hide flashing console windows on child process spawns

**Problem:** When Prime Agent spawned child processes on Windows (Git Bash for
commands, the IPython kernel, the fork server, and bootstrap commands), each one
opened a visible console window that flashed on screen.

**Fix:** Added `windowsHide: true` to all child process `spawn()` calls. This flag
is a no-op on macOS/Linux, so it is safe everywhere.

**Files:**
- `packages/coding-agent/src/core/tools/bash.ts` — bash tool spawn
- `packages/coding-agent/src/core/kernel/index.ts` — IPython kernel spawn
- `packages/coding-agent/src/core/kernel/fork-server.ts` — fork server spawn
- `packages/coding-agent/src/core/kernel/bootstrap.ts` — bootstrap `run()` helper

**Verify:** Run a `%%bash` cell or a Python script in a session; no console windows
should flash.

---

### 2026-08-05 — Fix daemon command recovery journal `EPERM` crash

**Problem:** The daemon's command recovery journal crashed on Windows with
`EPERM: operation not permitted, fsync`. The `compact()` method called `fsyncSync`
on a directory handle, which is unsupported on Windows.

**Fix:** Wrapped the directory fsync in a try/catch. The atomic rename still
protects readers; directory fsync is only a durability optimization on POSIX.

**Files:**
- `packages/coding-agent/src/modes/daemon/command-recovery-journal.ts` — guarded
  the directory fsync in `compact()`

**Verify:** Start the daemon and run commands; the daemon log should no longer
contain repeated `EPERM: operation not permitted, fsync` errors.

---

### 2026-08-05 — Fix kernel bootstrap venv Python path on Windows

**Problem:** The kernel bootstrap hardcoded the POSIX venv Python path
(`bin/python`), which does not exist on Windows. A uv-created venv on Windows
places its interpreter at `Scripts\python.exe`. This caused the IPython kernel to
fail to bootstrap with a misleading "needs internet access to install dependencies
or a valid PRIME_AGENT_KERNEL_PYTHON" error.

**Fix:** Added a `venvPythonPath()` helper that resolves the interpreter per
platform (`Scripts\python.exe` on win32, `bin/python` elsewhere) and used it in
place of the hardcoded path.

**Files:**
- `packages/coding-agent/src/core/kernel/bootstrap.ts` — added `venvPythonPath()`
  and replaced the hardcoded `bin/python` paths in `bootstrapVenv()` and
  `ensureKernelPythonUncached()`

**Verify:** Run the kernel bootstrap; it should resolve to
`~/.prime/agent/kernel-venv/Scripts/python.exe` on Windows and the kernel should
start successfully.
