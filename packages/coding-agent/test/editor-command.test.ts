import { describe, expect, it } from "vitest";
import { createEditorLaunchCommand } from "../src/utils/editor-command.js";

describe("createEditorLaunchCommand", () => {
	it("preserves quoted Windows executable paths and arguments", () => {
		expect(
			createEditorLaunchCommand(
				'"C:\\Program Files\\Microsoft VS Code\\Code.exe" --wait',
				"C:\\Temp\\session.md",
				"win32",
			),
		).toEqual({
			command: "C:\\Program Files\\Microsoft VS Code\\Code.exe",
			args: ["--wait", "C:\\Temp\\session.md"],
		});
	});

	it("preserves Windows backslashes in unquoted arguments", () => {
		expect(
			createEditorLaunchCommand("code.cmd --user-data-dir=C:\\EditorData --wait", "C:\\Temp\\file.md", "win32"),
		).toEqual({
			command: "code.cmd",
			args: ["--user-data-dir=C:\\EditorData", "--wait", "C:\\Temp\\file.md"],
		});
	});

	it("parses quoted POSIX editor arguments", () => {
		expect(createEditorLaunchCommand("vim -c 'set spell'", "/tmp/file.md", "linux")).toEqual({
			command: "vim",
			args: ["-c", "set spell", "/tmp/file.md"],
		});
	});
});
