# CMS Favicon Mirroring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the favicon chosen in Directus at a same-origin root URL with one MIME-correct icon declaration, while retaining a version-controlled fallback.

**Architecture:** A pure Node module maps approved image MIME types to root-file descriptors. A build-only sync module reads the existing public `site_settings.favicon` field, mirrors the selected asset into `public/`, and generates the small contract consumed by `Layout.astro`. The static layout never points `rel="icon"` at Directus.

**Tech Stack:** Node.js 22 built-in test runner and fetch, Astro 6 static build, Directus public REST API, Vercel static hosting.

## Global Constraints

- Keep `site_settings.favicon` and the existing Directus rebuild Flow unchanged.
- Accept only Yandex-supported favicon MIME types: ICO, PNG, SVG, GIF, JPEG, and BMP.
- Emit exactly one `<link rel="icon">` with a same-origin root path and matching MIME type.
- Use `DIRECTUS_URL` from `.env`; document it in `.env.example` and never commit secrets.
- Preserve unrelated image changes in the working tree.
- Use Node built-in tests; do not add a test dependency.

---

### Task 1: Define and test the favicon media contract

**Files:**
- Create: `scripts/favicon-contract.mjs`
- Create: `test/favicon-contract.test.mjs`

**Interfaces:**
- Produces: `faviconDescriptor(contentType: string): { extension: string, type: string } | null`
- Produces: `manifestSource(descriptor: { extension: string, type: string }): string`
- Consumes: the raw `Content-Type` response header, including an optional `; charset=` suffix.

- [ ] **Step 1: Write the failing contract tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { faviconDescriptor, manifestSource } from "../scripts/favicon-contract.mjs";

test("maps a PNG content type with parameters to a same-origin root file", () => {
  assert.deepEqual(faviconDescriptor("image/png; charset=binary"), {
    extension: "png",
    type: "image/png",
  });
});

test("maps both ICO MIME types to favicon.ico", () => {
  assert.deepEqual(faviconDescriptor("image/vnd.microsoft.icon"), {
    extension: "ico",
    type: "image/x-icon",
  });
  assert.deepEqual(faviconDescriptor("image/x-icon"), {
    extension: "ico",
    type: "image/x-icon",
  });
});

test("rejects unsupported content types", () => {
  assert.equal(faviconDescriptor("application/pdf"), null);
});

test("writes a typed same-origin Astro manifest", () => {
  assert.equal(
    manifestSource({ extension: "svg", type: "image/svg+xml" }),
    'export const favicon = { href: "/favicon.svg", type: "image/svg+xml" } as const;\\n',
  );
});
```

- [ ] **Step 2: Run the contract tests to verify they fail**

Run: `node --test test/favicon-contract.test.mjs`

Expected: FAIL because `scripts/favicon-contract.mjs` does not exist.

- [ ] **Step 3: Implement the minimal pure contract**

```js
const DESCRIPTORS = new Map([
  ["image/x-icon", { extension: "ico", type: "image/x-icon" }],
  ["image/vnd.microsoft.icon", { extension: "ico", type: "image/x-icon" }],
  ["image/png", { extension: "png", type: "image/png" }],
  ["image/svg+xml", { extension: "svg", type: "image/svg+xml" }],
  ["image/gif", { extension: "gif", type: "image/gif" }],
  ["image/jpeg", { extension: "jpg", type: "image/jpeg" }],
  ["image/bmp", { extension: "bmp", type: "image/bmp" }],
]);

export function faviconDescriptor(contentType) {
  return DESCRIPTORS.get(contentType.split(";", 1)[0].trim().toLowerCase()) ?? null;
}

export function manifestSource({ extension, type }) {
  return `export const favicon = { href: "/favicon.${extension}", type: "${type}" } as const;\\n`;
}
```

- [ ] **Step 4: Run the contract tests to verify they pass**

Run: `node --test test/favicon-contract.test.mjs`

Expected: PASS with four tests.

- [ ] **Step 5: Commit the contract**

```bash
git add scripts/favicon-contract.mjs test/favicon-contract.test.mjs
git commit -m 'feat: define favicon media contract'
```

### Task 2: Mirror the CMS asset before the Astro build

**Files:**
- Create: `scripts/sync-favicon.mjs`
- Create: `test/sync-favicon.test.mjs`
- Create: `src/assets/favicon-fallback.ico` by moving `public/favicon.ico`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`

**Interfaces:**
- Consumes: `syncFavicon({ rootDir, directusUrl, fetchImpl }): Promise<{ href: string, type: string, source: "cms" | "fallback" }>`.
- Produces: one generated file at `src/generated/favicon.ts` and one root favicon file in `public/`.
- Depends on: `faviconDescriptor()` and `manifestSource()` from `scripts/favicon-contract.mjs`.

- [ ] **Step 1: Write the failing sync test**

```js
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { syncFavicon } from "../scripts/sync-favicon.mjs";

test("mirrors a CMS PNG and generates its matching manifest", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "norvex-favicon-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
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
    'export const favicon = { href: "/favicon.png", type: "image/png" } as const;\\n',
  );
});
```

- [ ] **Step 2: Run the sync test to verify it fails**

Run: `node --test test/sync-favicon.test.mjs`

Expected: FAIL because `scripts/sync-favicon.mjs` does not exist.

- [ ] **Step 3: Implement the minimal sync module**

Implement `syncFavicon()` with these exact behaviors:

```js
const settingsUrl = `${directusUrl.replace(/\/$/, "")}/items/site_settings?fields=favicon`;
const settings = await fetchImpl(settingsUrl).then(assertOk).then((res) => res.json());
const fileId = settings.data?.favicon;
```

- If `fileId` is absent, copy `src/assets/favicon-fallback.ico` to `public/favicon.ico`, write the fallback manifest, remove all generated non-ICO favicon candidates, and return `{ href: "/favicon.ico", type: "image/x-icon", source: "fallback" }`.
- If the settings request fails because of a network exception, use the same fallback behavior and log one warning beginning `[favicon]`.
- If the asset request returns a non-2xx HTTP response, throw an error that contains the asset URL and response status.
- If `faviconDescriptor(response.headers.get("content-type") ?? "")` returns `null`, throw an error that contains the unsupported MIME type.
- On success, remove every candidate root file before writing the selected `/favicon.<extension>` file, then write the matching generated manifest.
- When the module is the executed program, call `syncFavicon()` with `rootDir: process.cwd()`, `directusUrl: process.env.DIRECTUS_URL`, and global `fetch`; exit nonzero with the error message if `DIRECTUS_URL` is missing.

- [ ] **Step 4: Expand tests for fallback and invalid input**

Add `mkdir` and `writeFile` to the `node:fs/promises` import, then add these
complete tests:

```js
test("uses the committed ICO fallback when Directus has no favicon", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "norvex-favicon-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const fallback = Buffer.from([0, 0, 1, 0]);
  await mkdir(join(rootDir, "src", "assets"), { recursive: true });
  await writeFile(join(rootDir, "src", "assets", "favicon-fallback.ico"), fallback);

  const result = await syncFavicon({
    rootDir,
    directusUrl: "https://cms.example",
    fetchImpl: async () => Response.json({ data: { favicon: null } }),
  });

  assert.deepEqual(result, { href: "/favicon.ico", type: "image/x-icon", source: "fallback" });
  assert.deepEqual(await readFile(join(rootDir, "public", "favicon.ico")), fallback);
  assert.equal(
    await readFile(join(rootDir, "src", "generated", "favicon.ts"), "utf8"),
    'export const favicon = { href: "/favicon.ico", type: "image/x-icon" } as const;\\n',
  );
});

test("rejects a CMS asset with an unsupported MIME type", async (t) => {
  const rootDir = await mkdtemp(join(tmpdir(), "norvex-favicon-"));
  t.after(() => rm(rootDir, { recursive: true, force: true }));
  const fetchImpl = async (url) => url.endsWith("?fields=favicon")
    ? Response.json({ data: { favicon: "pdf-file-id" } })
    : new Response("not an icon", { headers: { "content-type": "application/pdf" } });

  await assert.rejects(
    syncFavicon({ rootDir, directusUrl: "https://cms.example", fetchImpl }),
    /Unsupported favicon MIME type: application\/pdf/,
  );
});
```

- [ ] **Step 5: Add build wiring and generated-file hygiene**

Add the public build setting to `.env.example`:

```dotenv
DIRECTUS_URL=http://127.0.0.1:18055
```

Add these commands to `package.json`:

```json
"predev": "node --env-file-if-exists=.env scripts/sync-favicon.mjs",
"prebuild": "node --env-file-if-exists=.env scripts/sync-favicon.mjs",
"test": "node --test test/favicon-contract.test.mjs test/sync-favicon.test.mjs"
```

Move the current tracked `public/favicon.ico` to `src/assets/favicon-fallback.ico`. Add these generated files to `.gitignore`:

```gitignore
/public/favicon.ico
/public/favicon.png
/public/favicon.svg
/public/favicon.gif
/public/favicon.jpg
/public/favicon.bmp
/src/generated/favicon.ts
```

Configure the same public `DIRECTUS_URL` value in GitHub Actions and Vercel before deploying. The sync script must not ship a CMS-managed icon when the build lacks this environment value.

- [ ] **Step 6: Run the complete sync test suite**

Run: `npm test`

Expected: PASS with all contract and sync tests.

- [ ] **Step 7: Commit CMS mirroring**

```bash
git add .env.example .gitignore package.json scripts src/assets test
git commit -m 'feat: mirror CMS favicon during builds'
```

### Task 3: Emit one typed same-origin favicon link

**Files:**
- Modify: `src/layouts/Layout.astro:4-27,71-74`
- Modify: `package.json`
- Create: `test/favicon-layout.test.mjs`

**Interfaces:**
- Consumes: `favicon` from generated `src/generated/favicon.ts` with properties `href` and `type`.
- Produces: one `<link rel="icon">` tag in every locale page.

- [ ] **Step 1: Write the failing layout-contract test**

Create `test/favicon-layout.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

test("layout emits one typed same-origin favicon from the generated contract", async () => {
  const layout = await readFile(join(rootDir, "src", "layouts", "Layout.astro"), "utf8");

  assert.match(layout, /import \{ favicon \} from "\.\.\/generated\/favicon";/);
  assert.match(layout, /<link rel="icon" href=\{favicon\.href\} type=\{favicon\.type\} \/>/);
  assert.doesNotMatch(layout, /faviconHref/);
  assert.doesNotMatch(layout, /rel="shortcut icon"/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails before the layout changes**

Run: `node --test test/favicon-layout.test.mjs`

Expected: FAIL because the source layout imports neither the generated contract
nor its one typed `rel="icon"` declaration.

- [ ] **Step 3: Replace the dynamic Directus icon declarations**

Make these exact layout changes:

```astro
---
import { favicon } from "../generated/favicon";
// Keep the existing site_settings query, but remove its favicon field and faviconHref.
---
<link rel="icon" href={favicon.href} type={favicon.type} />
```

Remove both existing `rel="icon"` and `rel="shortcut icon"` tags. Do not alter the
site settings query fields that remain used by Open Graph, analytics, or type scaling.

Extend the `test` command in `package.json` to include the new file:

```json
"test": "node --test test/favicon-contract.test.mjs test/sync-favicon.test.mjs test/favicon-layout.test.mjs"
```

- [ ] **Step 4: Verify generated output**

Run: `npm run build && rg -o '<link rel="icon"[^>]*>' dist/ru/index.html | wc -l && rg -n '<link rel="icon" href="/favicon\.(ico|png|svg|gif|jpg|bmp)" type="image/' dist/ru/index.html`

Expected: command exits 0; count is `1`; the one link has a root `favicon.*` URL and matching MIME type.

- [ ] **Step 5: Run all automated checks**

Run: `npm test && npm run build`

Expected: all Node tests, including `test/favicon-layout.test.mjs`, pass and
Astro exits with status 0.

- [ ] **Step 6: Commit the layout contract**

```bash
git add package.json src/layouts/Layout.astro test/favicon-layout.test.mjs
git commit -m 'fix: publish one same-origin favicon link'
```

### Task 4: Verify the deployed surface and hand off CMS usage

**Files:**
- Modify: `README.md` only if it needs a one-paragraph note about `DIRECTUS_URL` for build-time favicon mirroring.

**Interfaces:**
- Consumes: the production deployment created by the existing `directus-publish` Flow.
- Produces: evidence that YandexBot can fetch the same file declared by the live HTML.

- [ ] **Step 1: Confirm deployment configuration before release**

Set `DIRECTUS_URL=http://127.0.0.1:18055` in the GitHub Actions environment used by CI and the Vercel Production environment. Do not add a token: the singleton and assets are public-read.

- [ ] **Step 2: Build and deploy through the existing main-branch workflow**

Run the normal repository deployment process after the final commit. Do not deploy unrelated image changes.

- [ ] **Step 3: Verify the live favicon and YandexBot response**

Run:

```bash
curl -sSIL https://norvexhse.com/favicon.png
curl -A 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)' \\
  -sS -o /dev/null -w '%{http_code} %{content_type} %{url_effective}\\n' \\
  https://norvexhse.com/favicon.png
curl -sSL https://norvexhse.com/ru/ | rg -o '<link rel="icon"[^>]*>'
```

Expected: direct `200`, a matching image MIME type, no redirect, and exactly the same root path in the one HTML icon tag.

- [ ] **Step 4: Submit the correct page in Yandex Webmaster**

From the verified `https://norvexhse.com` property, submit `https://norvexhse.com/ru/` for reindexing. Do not submit the old `http://norvexhse.com:80` property.

- [ ] **Step 5: Commit documentation, if changed**

```bash
git add README.md
git commit -m 'docs: describe CMS favicon build configuration'
```
