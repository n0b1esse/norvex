# CMS Favicon Mirroring Design

## Goal

Let an editor continue choosing `site_settings.favicon` in Directus while every
published Astro build exposes exactly one same-origin favicon URL that Yandex
can fetch predictably.

## Scope

- Keep the existing `site_settings.favicon` field and Directus rebuild Flow.
- Do not add a Directus collection, field, token, or runtime endpoint.
- Do not keep a Directus asset URL in a `rel="icon"` tag.
- Do not change the existing logo, Open Graph image, sitemap, or robots policy.

## Selected architecture

A small Node prebuild script mirrors the public Directus favicon asset into the
Astro `public/` directory. It writes a generated favicon manifest containing
the same-origin root URL and the matching MIME type. `Layout.astro` imports
that manifest and emits one `<link rel="icon">` tag.

The script is the only module that knows how a Directus file record becomes a
static favicon. The layout only consumes the explicit `{ href, type }` contract.

## Data flow

1. An editor updates `site_settings.favicon` in Directus.
2. The existing Directus Flow dispatches the production rebuild.
3. Before Astro starts, the sync script requests only the `favicon` field from
   the public `site_settings` singleton.
4. If an asset ID is present, the script downloads that public asset, validates
   its HTTP success status and MIME type, and writes it as `/favicon.<extension>`
   in `public/`.
5. The script writes a generated manifest that maps that file to its exact MIME
   type. Astro uses the manifest to render one `rel="icon"` tag.
6. Vercel serves the copied file from `https://norvexhse.com/favicon.<extension>`.
   Yandex receives the same-origin file, correct content type, and one
   unambiguous declaration.

## Formats and fallback

- Supported CMS MIME types: ICO, PNG, SVG, GIF, JPEG, and BMP—the formats
  accepted by Yandex for favicons.
- The extension and HTML `type` come from a fixed MIME map, never from an
  uploaded filename.
- The existing committed multi-size `public/favicon.ico` remains the fallback.
  When Directus has no favicon or cannot be read during a build, the generated
  manifest points only to `/favicon.ico` with `image/x-icon`.
- A malformed or unsupported CMS file fails the build with a concise error.
  Shipping an invalid favicon is worse than surfacing a CMS mistake; a
  temporary network failure uses the known-good fallback instead.

## Configuration

The sync script uses the existing public `DIRECTUS_URL` build setting. This
must be declared in the central environment configuration and provided to both
GitHub Actions and Vercel. A committed `.env.example` documents the variable;
real environment files and secrets remain uncommitted.

## Planned file changes

- Create `scripts/sync-favicon.mjs`: fetch, validate, mirror, and generate the
  favicon manifest.
- Create `src/generated/favicon.ts` at build time and ignore it in Git.
- Modify `src/layouts/Layout.astro`: consume the generated manifest and remove
  the Directus-based `rel="icon"` declaration plus duplicate shortcut icon.
- Modify `package.json`: run the sync before `dev` and `build`; provide a Node
  test command.
- Create `test/sync-favicon.test.mjs`: cover MIME mapping, fallback selection,
  valid CMS file output, and rejection of unsupported content types.
- Add `.env.example` and update `.gitignore` for generated favicon outputs.

## Verification

1. Unit tests prove the MIME map and fallback behavior.
2. A production build proves the generated root asset and the single favicon
   declaration.
3. A local HTTP check verifies `/favicon.<extension>` returns `200` with the
   declared MIME type and no redirect.
4. After deployment, repeat the live checks with a YandexBot user agent and
   submit the HTTPS `/ru/` page for reindexing in Yandex Webmaster.
