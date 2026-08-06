# Windows Improvements

This file tracks improvements made to make Prime Agent work better on Windows.
Each entry documents a specific fix, the files it touched, and how to verify it.

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
