import { describe, expect, test } from "vitest";
import { getDefaultAgentDirs } from "../src/config.js";
import { getFallbackKernelVenvDir } from "../src/core/kernel/bootstrap.js";

describe("Windows user data paths", () => {
	test("uses AppData roots for a fresh installation", () => {
		const homeDir = "C:\\Users\\tester";
		const environment = {
			APPDATA: "C:\\Users\\tester\\AppData\\Roaming",
			LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local",
		};

		expect(getDefaultAgentDirs("win32", environment, homeDir, () => false)).toEqual({
			configDir: "C:\\Users\\tester\\AppData\\Roaming\\Prime Agent",
			dataDir: "C:\\Users\\tester\\AppData\\Local\\Prime Agent",
		});
	});

	test("keeps an existing legacy installation in place", () => {
		const homeDir = "C:\\Users\\tester";
		const legacyDir = "C:\\Users\\tester\\.prime\\agent";

		expect(getDefaultAgentDirs("win32", {}, homeDir, (path) => path === legacyDir)).toEqual({
			configDir: legacyDir,
			dataDir: legacyDir,
		});
	});

	test("uses LocalAppData for the fallback kernel environment", () => {
		expect(
			getFallbackKernelVenvDir("win32", { LOCALAPPDATA: "C:\\Users\\tester\\AppData\\Local" }, "C:\\Users\\tester"),
		).toBe("C:\\Users\\tester\\AppData\\Local\\Prime Agent\\kernel-venv");
	});
});
