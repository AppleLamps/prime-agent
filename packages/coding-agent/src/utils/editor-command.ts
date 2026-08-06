export interface EditorLaunchCommand {
	command: string;
	args: string[];
}

function parseWindowsCommandLine(value: string): string[] {
	const args: string[] = [];
	let index = 0;

	while (index < value.length) {
		while (/\s/.test(value[index] ?? "")) index++;
		if (index >= value.length) break;

		let arg = "";
		let inQuotes = false;
		while (index < value.length && (inQuotes || !/\s/.test(value[index] ?? ""))) {
			if (value[index] !== "\\") {
				if (value[index] === '"') {
					inQuotes = !inQuotes;
				} else {
					arg += value[index];
				}
				index++;
				continue;
			}

			let backslashCount = 0;
			while (value[index] === "\\") {
				backslashCount++;
				index++;
			}
			if (value[index] !== '"') {
				arg += "\\".repeat(backslashCount);
				continue;
			}
			arg += "\\".repeat(Math.floor(backslashCount / 2));
			if (backslashCount % 2 === 0) {
				inQuotes = !inQuotes;
			} else {
				arg += '"';
			}
			index++;
		}

		if (inQuotes) throw new Error("Editor command contains an unterminated quote");
		args.push(arg);
	}

	return args;
}

function parsePosixCommandLine(value: string): string[] {
	const args: string[] = [];
	let current = "";
	let quote: "'" | '"' | undefined;
	let started = false;

	for (let index = 0; index < value.length; index++) {
		const character = value[index]!;
		if (!quote && /\s/.test(character)) {
			if (started) {
				args.push(current);
				current = "";
				started = false;
			}
			continue;
		}
		if (character === "'" && quote !== '"') {
			quote = quote === "'" ? undefined : "'";
			started = true;
			continue;
		}
		if (character === '"' && quote !== "'") {
			quote = quote === '"' ? undefined : '"';
			started = true;
			continue;
		}
		if (character === "\\" && quote !== "'" && index + 1 < value.length) {
			current += value[++index];
			started = true;
			continue;
		}
		current += character;
		started = true;
	}

	if (quote) throw new Error("Editor command contains an unterminated quote");
	if (started) args.push(current);
	return args;
}

export function createEditorLaunchCommand(
	editorCommand: string,
	filePath: string,
	platform: NodeJS.Platform = process.platform,
): EditorLaunchCommand {
	const parts = platform === "win32" ? parseWindowsCommandLine(editorCommand) : parsePosixCommandLine(editorCommand);
	const command = parts.shift();
	if (!command) throw new Error("Editor command is empty");
	return { command, args: [...parts, filePath] };
}
