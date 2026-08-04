import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readGalleryEntries, buildGalleryReadme } from "../../../scripts/generate-gallery-readme.ts";

// Drift prevention, not convention: rebuilds themes/README.md from the same
// themes/*.css files the generator reads and asserts the committed file is
// byte-identical. An added/removed gallery theme, an edited `/*! @name … */`
// frontmatter block, or a hand-edit to the README itself fails this test —
// which `pnpm test` already runs in CI — rather than drifting silently.
// Precedent: registry.test.ts's "generated palette" describe block does the
// same thing for theme-colors.ts against the builtin registry.
const GALLERY_DIR = join(process.cwd(), "themes");
const README_PATH = join(GALLERY_DIR, "README.md");

describe("gallery README generation", () => {
	it("matches the committed themes/README.md exactly", () => {
		const entries = readGalleryEntries(GALLERY_DIR);
		const generated = buildGalleryReadme(entries);
		const committed = readFileSync(README_PATH, "utf8");
		expect(generated).toBe(committed);
	});
});
