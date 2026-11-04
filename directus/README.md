# Directus content model

The Norvex Directus instance (http://127.0.0.1:18055) backs the Astro frontend.
`setup_schema.py` creates all collections, grants public read access, and seeds the current
content. It's safe to read as the source of truth for the data model.

## Run / re-run

```bash
DIRECTUS_URL=http://127.0.0.1:18055 \
DIRECTUS_EMAIL=<admin email> DIRECTUS_PASSWORD=<admin password> \
python3 directus/setup_schema.py
```

Creates collections only if missing, but **seeding is not idempotent** — only run the full
script against a fresh instance, or it duplicates the repeatable rows.

## Collections

Repeatable (each has `status` + `sort`):
| Collection | Fields | Seeded |
|---|---|---|
| `services` | icon, slug, title, description | 6 |
| `cooperation_models` | icon, slug, title, description, points (json[]) | 3 |
| `team_members` | name, position, experience, photo (file) | 4 |
| `document_categories` | icon, slug, title | 4 |
| `documents` | title, category (M2O → categories), file (file), file_size | 15 |

Singletons:
| Collection | Key fields |
|---|---|
| `site_settings` | phone, whatsapp, telegram, email, address, working_hours, footer_tagline, social_* |
| `home_page` | hero_title, hero_subtitle, hero_features (json), highlights_title, highlights (json) |
| `about_page` | title, intro, stats (json), advantages (json) |

Intake:
| Collection | Notes |
|---|---|
| `contact_submissions` | name, company, phone, email, message, date_created — **public can CREATE, not read** |

`icon` string values match the frontend `Icon.astro` set (e.g. `shield-check`, `globe`, `settings`).

## Permissions (Public policy)

- Public **read** on all content collections + `directus_files` (so `/assets/<id>` works).
- Public **create** on `contact_submissions`; public read on it is denied (privacy).
- The free **Core plan forbids custom permission rules / field subsets** on public access, so
  grants are full (`fields: *`, no filter). All seeded rows are `published`; filter drafts at
  the query layer (`?filter[status][_eq]=published`) rather than via permission rules.

## i18n (translations)

- `setup_ui_i18n.py` — `ui_strings` collection (key + ru/en/ky columns) for UI chrome.
- `setup_content_i18n.py` — migrates the content collections to **native Directus Translations**:
  creates a `languages` collection (ru/en/ky), a `<coll>_translations` junction + a `translations`
  alias per collection, moves the translatable fields into the junction, migrates RU data, adds
  EN/KY, and drops the now-translated base columns. Idempotent per collection. Run once.
- Non-translatable fields (slug, icon, sort, status, photo, file, category, phone/email/socials)
  remain on the base collections.
- `fix_review_issues.py` — additive follow-ups (idempotent): adds a translatable `name` to
  `team_members_translations` (EN transliterated, RU/KY Cyrillic), the `about.why_title`
  UI string, and shortens the `nav.cooperation` label. The base `team_members.name` is kept
  as a fallback/identifier.
- `add_image_fields.py` — adds `file-image` upload fields: `home_page.hero_image`,
  `about_page.image`, `cooperation_models.image` (idempotent). `team_members.photo` already existed.
- `add_brand_map_fields.py` — adds `site_settings.logo` + `site_settings.favicon` (file-image,
  used by `Logo.astro` header/footer + the `<link rel=icon>` in `Layout.astro`) and
  `site_settings.map_url` (optional Google Maps *embed* URL for the contacts page; if blank the
  page derives a keyless embed from the translated `address`). Uploads `public/norvexLogo.png`
  once and points logo+favicon at it (idempotent — skips upload if `logo` is already set).
- `add_typography_fields.py` — adds three slider fields to `site_settings` (`type_scale_hero`,
  `type_scale_heading`, `type_scale_body`), bounded 0.8–1.4, default 1.0. Each is a multiplier the
  frontend applies via CSS `calc()` to a curated set of selectors (hero titles / section & card
  headings / body text & leads). `Layout.astro` reads them and sets `--ts-hero/--ts-heading/--ts-body`
  as an inline style on `<html>` (inline beats the `:root` defaults in `global.css`, order-independent).
  Bounded + multiplier so editors resize text site-wide without breaking layout. Idempotent. Note:
  the static site only reflects a change after the rebuild Flow redeploys (~1–2 min), like any content.
- `add_footer_logo_field.py` — adds `site_settings.footer_logo` (file-image) so the footer can use
  its own mark (e.g. a light/white variant); `Logo.astro` uses it when rendered in the footer and
  falls back to the main `logo` (then the inline SVG) if empty. No upload — the editor sets it.
- `setup_analytics.py` — self-hosted page-view analytics. Creates a `page_views` intake collection
  (public **create**, no public read — like `contact_submissions`), grants the **Client** role read
  on it + `directus_dashboards`/`directus_panels` (so the chart shows in their login), and builds an
  Insights dashboard **"Посещаемость сайта"** (total views, unique visitors, views-per-day; bots
  excluded via an `is_bot` filter). A beacon in `src/layouts/Layout.astro` POSTs `{path,lang,referrer,
  visitor,is_bot}` once per page load. Idempotent (skips collection/dashboard if present).
- `setup_icon_picker_and_repeaters.py` — admin-UX upgrade (only touches field `meta`, no data migrated):
  turns the `icon` fields (`services`/`cooperation_models`/`document_categories` + the `icon` sub-field in the
  repeaters below) into a curated **searchable dropdown** of ~70 EHS-relevant Lucide icons, each shown with a Material
  glyph beside the label. `allowOther` is **false** on purpose — Directus's `select-list-item.vue` only renders the
  per-choice glyph when `multiple === false && allowOther === false`, so with allowOther on the menu shows labels only;
  to use a name outside the list, add it to `CHOICES` and re-run (it also normalizes legacy values `scales`→`scale`,
  `refresh`→`refresh-cw` so every stored value matches a choice and shows its glyph). It also replaces the raw-JSON (`input-code`)
  editors with proper forms — `home_page.hero_features`/`highlights`, `about_page.stats`/`advantages` become **list
  repeaters** (`[{...}]`), and `cooperation_models.points` becomes a **tags** field (preserves the `["…","…"]` string
  array — `list` would wrap each in an object and break the shape). Idempotent. Hard-refresh the admin after running.
- `fix_admin_display.py` — repoints admin display config left dangling after the i18n migration
  dropped base columns: `documents.category` template, collection `display_template`s, and the
  `languages` display, all to `{{translations.<field>}}` / `{{name}}`.
- `fix_translations_interface.py` — sets `junction_field` on both relations of every
  `<coll>_translations` junction. Without it the translations M2M can't resolve and the admin
  Translations field renders empty. (Now also baked into `setup_content_i18n.py` for fresh setups.)
- `setup_seo.py` — SEO, all admin-editable. Adds `site_settings.og_image` (file-image, the default
  social-share preview; the build falls back to `/norvexHero.jpg` when empty) and seeds `ui_strings`
  rows `seo.<page>.title` / `seo.<page>.desc` (ru/en/ky) for the 7 pages — editors change the per-page
  `<title>` and meta description right in the **UI Strings** collection. `Layout.astro` reads them
  via `getT()` and builds canonical + hreflang + Open Graph/Twitter + Organization JSON-LD; the
  `@astrojs/sitemap` integration emits `sitemap-index.xml`. Idempotent (only inserts seo.* keys that
  don't exist yet, so it never clobbers edits made in Directus).
- `add_privacy_strings.py` — seeds the ui_strings for the privacy-policy page (`/​<lang>/privacy`):
  contact-form consent checkbox (`form.consent` + `form.consent_link`), `footer.privacy` link and
  `seo.privacy.*`. The policy text itself is static in `src/pages/[lang]/privacy.astro` (legal copy,
  changes rarely — move to a CMS singleton only if editors ask). Idempotent.
- `setup_rebuild_flow.py` — creates a Directus Flow that POSTs a GitHub `repository_dispatch`
  (`directus-publish`) on content change → triggers ci-cd.yml → rebuild + Vercel deploy. Watches
  all non-system collections except `contact_submissions`. Needs a fine-grained `GITHUB_PAT`
  (repo `NEW_OWNER/norvex`, Contents: Read+write).
- After running, hard-refresh the admin (cached schema) or `POST /utils/cache/clear`.

Query a collection in one language (RU fallback handled client-side):
```
GET /items/services?fields=slug,icon,translations.*&filter[status][_eq]=published&sort=sort
```

## Consuming from the frontend (next step)

Static-build fetch, no token needed (public read). Examples:
```
GET /items/services?filter[status][_eq]=published&sort=sort
GET /items/documents?fields=*,category.slug,category.title&sort=sort
GET /items/home_page            GET /items/site_settings
Image/file URL: <DIRECTUS_URL>/assets/<file-id>
```
