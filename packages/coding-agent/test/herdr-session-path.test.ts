import { describe, expect, it } from "vitest";
import { isAbsoluteSessionPath } from "../src/core/extensions/builtin/herdr-agent-state.js";

describe("Herdr session paths", () => {
	it.runIf(process.platform === "win32")("accepts a Windows drive-letter path", () => {
		expect(isAbsoluteSessionPath("C:\\Users\\tester\\sessions\\session.jsonl")).toBe(true);
	});

	it("rejects relative session paths", () => {
		expect(isAbsoluteSessionPath("sessions/session.jsonl")).toBe(false);
	});
});
