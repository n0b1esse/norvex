import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

test("layout emits one typed same-origin favicon from the generated contract", async () => {
  const layout = await readFile(join(rootDir, "src", "layouts", "Layout.astro"), "utf8");

  assert.match(layout, /import \{ favicon \} from "\.\.\/generated\/favicon";/);
  assert.match(layout, /<link rel="icon" href=\{favicon\.href\} type=\{favicon\.type\} \/>/);
  assert.doesNotMatch(layout, /faviconHref/);
  assert.doesNotMatch(layout, /rel="shortcut icon"/);
});
