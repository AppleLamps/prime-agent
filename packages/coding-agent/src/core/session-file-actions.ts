import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import trash from "trash";

export type DeleteSessionFileResult = { ok: true; method: "trash" | "unlink" } | { ok: false; error: string };

export interface DeleteSessionFileOptions {
	afterFileRemoved?: () => void;
	moveToTrash?: (paths: string[]) => Promise<void>;
}

const movePathsToTrash = (paths: string[]): Promise<void> => trash(paths, { glob: false });

/**
 * Permanently remove a session's artifact directory (durable schedule state,
 * kernel snapshot, RLM scratch files, …), which lives at
 * `<dirname(sessionDir)>/session-artifacts/<id>`.
 * Only invoked on delete, never on deactivation.
 */
async function deleteSessionArtifacts(sessionPath: string): Promise<void> {
	const sessionId = basename(sessionPath).replace(/\.jsonl$/, "");
	if (!sessionId) return;
	const artifactDir = join(dirname(dirname(sessionPath)), "session-artifacts", sessionId);
	await rm(artifactDir, { recursive: true, force: true });
}

/** Move the session `.jsonl` to the platform recycle bin without silently deleting it. */
async function removeSessionFile(
	sessionPath: string,
	moveToTrash: (paths: string[]) => Promise<void>,
): Promise<DeleteSessionFileResult> {
	try {
		await moveToTrash([sessionPath]);
		return !existsSync(sessionPath)
			? { ok: true, method: "trash" }
			: { ok: false, error: "The recycle operation completed without removing the session file" };
	} catch (err) {
		if (!existsSync(sessionPath)) {
			return { ok: true, method: "trash" };
		}
		const error = err instanceof Error ? err.message : String(err);
		return { ok: false, error: `Could not move session to the recycle bin: ${error}` };
	}
}

/**
 * Move a session file to the platform recycle bin.
 * Also permanently removes the session's artifact directory, but only
 * once the session file itself is gone — otherwise a failed delete would orphan a
 * session whose kernel snapshot has already been destroyed.
 */
export async function deleteSessionFile(
	sessionPath: string,
	options: DeleteSessionFileOptions = {},
): Promise<DeleteSessionFileResult> {
	const result = await removeSessionFile(sessionPath, options.moveToTrash ?? movePathsToTrash);
	if (result.ok) {
		options.afterFileRemoved?.();
		await deleteSessionArtifacts(sessionPath);
	}
	return result;
}
