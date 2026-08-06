import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getWindowsGitBashPaths } from "../src/utils/shell.js";

describe("getWindowsGitBashPaths", () => {
	it("includes per-user and system Git for Windows installations", () => {
		const environment = {
			LOCALAPPDATA: "C:\\Users\\test\\AppData\\Local",
			ProgramFiles: "C:\\Program Files",
			"ProgramFiles(x86)": "C:\\Program Files (x86)",
		};

		expect(getWindowsGitBashPaths(environment)).toEqual([
			join(environment.LOCALAPPDATA, "Programs", "Git", "bin", "bash.exe"),
			join(environment.LOCALAPPDATA, "Git", "bin", "bash.exe"),
			join(environment.ProgramFiles, "Git", "bin", "bash.exe"),
			join(environment["ProgramFiles(x86)"], "Git", "bin", "bash.exe"),
		]);
	});
});
