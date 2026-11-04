import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { syncFavicon } from "../scripts/sync-favicon.mjs";

async function createRoot(t, fallback = Buffer.from([0, 0, 1, 0])) {
  const rootDir = await mkdtemp(join(tmpdir(), "norvex-favicon-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  await mkdir(join(rootDir, "src", "assets"), { recursive: true });
  await writeFile(join(rootDir, "src", "assets", "favicon-fallback.ico"), fallback);
  return { rootDir, fallback };
}

test("mirrors a CMS PNG and generates its matching manifest", async (t) => {
  const { rootDir } = await createRoot(t);
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith("?fields=favicon")) {
      return Response.json({ data: { favicon: "cms-file-id" } });
    }
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      headers: { "content-type": "image/png" },
    });
  };

  const result = await syncFavicon({ rootDir, directusUrl: "https://cms.example", fetchImpl });

  assert.deepEqual(result, { href: "/favicon.png", type: "image/png", source: "cms" });
  assert.deepEqual(calls, [
    "https://cms.example/items/site_settings?fields=favicon",
    "https://cms.example/assets/cms-file-id",
  ]);
  assert.deepEqual(await readFile(join(rootDir, "public", "favicon.png")), Buffer.from([137, 80, 78, 71]));
  assert.equal(
    await readFile(join(rootDir, "src", "generated", "favicon.ts"), "utf8"),
    'export const favicon = { href: "/favicon.png", type: "image/png" } as const;\n',
  );
});

test("uses the committed ICO fallback when Directus has no favicon", async (t) => {
  const { rootDir, fallback } = await createRoot(t);

  const result = await syncFavicon({
    rootDir,
    directusUrl: "https://cms.example",
    fetchImpl: async () => Response.json({ data: { favicon: null } }),
  });

  assert.deepEqual(result, { href: "/favicon.ico", type: "image/x-icon", source: "fallback" });
  assert.deepEqual(await readFile(join(rootDir, "public", "favicon.ico")), fallback);
  assert.equal(
    await readFile(join(rootDir, "src", "generated", "favicon.ts"), "utf8"),
    'export const favicon = { href: "/favicon.ico", type: "image/x-icon" } as const;\n',
  );
});

test("rejects an inaccessible CMS settings endpoint", async (t) => {
  const { rootDir } = await createRoot(t);

  await assert.rejects(
    syncFavicon({
      rootDir,
      directusUrl: "https://cms.example",
      fetchImpl: async () => new Response(null, { status: 503 }),
    }),
    /Favicon request failed: https:\/\/cms\.example\/items\/site_settings\?fields=favicon returned HTTP 503/,
  );
});

test("rejects a CMS asset with an unsupported MIME type", async (t) => {
  const { rootDir } = await createRoot(t);
  const fetchImpl = async (url) => url.endsWith("?fields=favicon")
    ? Response.json({ data: { favicon: "pdf-file-id" } })
    : new Response("not an icon", { headers: { "content-type": "application/pdf" } });

  await assert.rejects(
    syncFavicon({ rootDir, directusUrl: "https://cms.example", fetchImpl }),
    /Unsupported favicon MIME type: application\/pdf/,
  );
});
