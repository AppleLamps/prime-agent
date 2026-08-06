import { describe, expect, it } from "vitest";
import { DETACHED_CLI_SPAWN_OPTIONS } from "../src/cli/subprocess-launch.js";

describe("detached CLI spawn options", () => {
	it("hide detached child console windows", () => {
		expect(DETACHED_CLI_SPAWN_OPTIONS).toEqual({
			detached: true,
			windowsHide: true,
		});
	});
});
