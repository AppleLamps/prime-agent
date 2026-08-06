import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getUvCandidatePaths, getUvInstallCommand } from "../src/core/kernel/bootstrap.js";

describe("Windows uv bootstrap", () => {
	it("uses the official PowerShell installer", () => {
		const command = getUvInstallCommand("win32");

		expect(command.command).toBe("powershell.exe");
		expect(command.args).toContain("irm https://astral.sh/uv/install.ps1 | iex");
		expect(command.display).toContain("install.ps1");
	});

	it("probes standalone and package-manager installation locations", () => {
		const homeDir = "C:\\Users\\tester";
		const localAppData = "C:\\Users\\tester\\AppData\\Local";

		expect(getUvCandidatePaths("win32", { LOCALAPPDATA: localAppData }, homeDir)).toEqual([
			join(homeDir, ".local", "bin", "uv.exe"),
			join(localAppData, "Microsoft", "WinGet", "Links", "uv.exe"),
			join(homeDir, "scoop", "shims", "uv.exe"),
			join(homeDir, ".cargo", "bin", "uv.exe"),
		]);
	});
});
