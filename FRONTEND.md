# FRONTEND.md

Guide to the Norvex Astro frontend — architecture, conventions, and where things live.
(Committed to git: contains no secrets. Live credentials/infra are in the gitignored `CLAUDE.md`.)

## Stack

- **Astro 6** (`output: static`) — every page is prerendered to static HTML in `dist/`.
- **No UI framework** — plain `.astro` components + scoped `<style>` + small vanilla `<script>` islands.
- **Font:** Manrope (Google Fonts, loaded in `Layout.astro`). Supports Cyrillic — UI copy is Russian.
- Hosted on **Vercel** (static). CI/CD in `.github/workflows/ci-cd.yml`.

## Commands

```bash
npm run dev      # dev server w/ hot reload  → http://localhost:4321
npm run build    # static build              → dist/
npm run preview  # serve the built dist/ as-is
```

## Structure

```
src/
  layouts/Layout.astro      # <html> shell, <head>, font, global.css, Header + <slot/> + Footer
  components/
    Header.astro            # sticky nav: dropdowns, <LangSwitch>, mobile burger, active-link
    Footer.astro            # 4-col footer (brand+socials, Меню, Услуги, Документы) + bottom bar
    LangSwitch.astro        # flag dropdown (ru/en/ky); links to the current path in each locale
    Logo.astro              # inline-SVG brand mark (PLACEHOLDER). props: variant "dark"|"light", height
    Icon.astro              # inline-SVG icon set. props: name, size, class. currentColor stroke
    Placeholder.astro       # labelled image placeholder box. props: label, dark, class, style
  pages/                    # one file = one route
    index.astro       /            Главная (dark hero + features + "кто мы" trio)
    about.astro       /about       О компании (hero + stats card + "почему выбирают" grid)
    services.astro    /services    Услуги (6 service cards, each has id anchor)
    cooperation.astro /cooperation Модели сотрудничества (interactive tabs)
    team.astro        /team        Команда (member cards)
    documents.astro   /documents   Документы (category sidebar + doc list)
    contacts.astro    /contacts    Контакты (info + form + map)
  styles/global.css         # design tokens + shared component classes
```

## Design system (`src/styles/global.css`)

CSS custom properties on `:root` — **always use these, don't hardcode colors**:
- Navy: `--navy-900` (hero/footer bg), `--navy-700`, `--navy` (headings)
- Green accent: `--green-500` (primary), `--green-600`/`--green-700` (hover/text)
- `--ink` (body), `--muted` (secondary text), `--bg` (soft gray section), `--border`, `--surface`
- `--radius`, `--shadow`, `--container` (1200px), `--nav-h`

Shared classes: `.container`, `.section` / `.bg-soft`, `.section-head`(+`.left`) with `.section-title`/`.bar`/`.section-lead`,
`.btn` variants (`.btn-primary`, `.btn-outline`, `.btn-outline-green`, `.btn-ghost-disabled`),
`.card`, `.icon-badge`/`.icon-circle`(`.on-dark`), `.placeholder`(`.on-dark`), `.grid`/`.grid-2..4`.
Breakpoints used across pages: 1340px (header nav→burger), ~900px, 640/560px (stack grids).

**Sticky footer:** `body` is a `min-height:100dvh` flex column and `<main>` grows (`flex:1 0 auto`)
so the footer always sits at the bottom, even on short pages. On a short page whose **last section
is coloured** (`.bg-soft`), add `.fill-to-footer` to that section so it stretches to the footer
instead of leaving a band of `<main>`'s white background above it (currently on index/services/
documents). White last sections don't need it — their stretch is invisible. Opt-in by design: not
keyed on `:last-child`, so no page is stretched by accident.

**Header (`Header.astro`):** a **full-width** 3-column bar — logo pinned to the left corner, nav
dead-centred, actions (`<LangSwitch>` + consult CTA) pinned to the right corner. The bar spans the
viewport (padding `clamp(20px,3.2vw,56px)`; only the page content below is capped at 1200px) so the
logo/actions sit in the real corners and there's room to centre the nav without it colliding with
either side. Side columns are equal (`flex:1 1 0`) so the nav lands at the true centre. The full
inline nav shows above **1340px** and collapses to a burger drawer below it — that threshold is what
guarantees the centred nav always fits (the RU links + logo + CTA are wider than a 1200px container).
The **language switcher always lives in the bar, never the drawer**: on mobile it sits just before the
burger; the drawer holds the nav links + the consult CTA. Its dropdown is always the absolute overlay
(no inline-in-drawer variant any more). If you add/rename nav items, re-check the fit and bump the
1340px breakpoint if needed.

## Conventions

- **New page:** create `src/pages/<name>.astro`, wrap content in `<Layout title="… — NORVEX">`. Nav auto-highlights via
  `Astro.url.pathname` in `Header.astro` — add the link there (and Footer if needed). Use `.section` + `.container` + `.section-head`.
- **Icons:** `<Icon name="…" />` renders any of the ~1700 **Lucide** icons by kebab-case name (see lucide.dev/icons)
  via `lucide-static/icon-nodes.json`, plus a few brand marks (`whatsapp`/`telegram`/`linkedin`) kept as `brand` overrides
  in `Icon.astro`; `aliases` maps legacy names (`scales`→`scale`, `refresh`→`refresh-cw`). Unknown names fall back to `shield`.
  No edit needed to use a new Lucide icon — just type its name. Color comes from the parent's `color` (usually `--green-500`
  via `.icon-badge`). In Directus the `icon` fields are a curated **searchable dropdown** of ~70 EHS-relevant icons
  that shows a glyph beside each label; to use a Lucide name outside the list, add it to `CHOICES` in
  `directus/setup_icon_picker_and_repeaters.py` (the dropdown has `allowOther: false` — required so Directus renders
  the per-choice glyph) and re-run it.
- **Typography scale (CMS-controlled):** three `:root` multipliers — `--ts-hero`, `--ts-heading`, `--ts-body` (default
  `1` in `global.css`) — multiply the type sizes via `calc()` (e.g. `calc(clamp(26px,3.4vw,38px) * var(--ts-heading))`).
  `Layout.astro` reads `site_settings.type_scale_{hero,heading,body}` (sliders 0.8–1.4) and sets them as an inline
  `style` on `<html>` (inline wins over the defaults, clamped server-side as a guard). Selectors covered: hero/page
  titles (`--ts-hero`), `.section-title` + panel/card headings (`--ts-heading`), base text + `.section-lead` + hero
  paragraphs (`--ts-body`). Add new typographic selectors to the matching group. See `directus/add_typography_fields.py`.
- **Images:** every image is a `<Placeholder label="…" />` — these are the slots to wire to **Directus** later.
- **Interactivity** is per-page vanilla JS in a `<script>` block (Astro bundles & scopes them):
  - `cooperation.astro` — tabs (also reads `location.hash`, e.g. `/cooperation#outsourcing`)
  - `documents.astro` — category sidebar switching (empty categories are hidden at build)
  - `Header.astro` — mobile burger toggle + `LangSwitch.astro` flag dropdown (click/Escape/outside-click)
  - `team.astro` — "All specialists" expands the roster with a staggered FLIP animation (capped
    stagger + reduced-motion aware, so it stays smooth for any roster size)
  - `contacts.astro` — form submit POSTs to `contact_submissions` and shows a success/error note

## Intentional placeholders / TODO (when wiring real content)

- **Logo** (`Logo.astro`) is an SVG approximation — replace with the real asset.
- **Documents:** "Скачать" buttons are `disabled` (no PDFs yet). Enable + point to real file URLs when available.
- **Contact form:** posts to `POST /items/contact_submissions`. The map is a live, keyless Google
  Maps embed derived from the address (or `site_settings.map_url` if set).
- **Social / contact fields:** each `site_settings` contact field (`phone`/`whatsapp`/`telegram`/
  `email`/`instagram`/`linkedin`) is a **multiline** textarea — one value per line. The shared
  `lines()` helper (in `src/lib/social.ts`) splits them; `telUrl/waUrl/tgUrl/mailUrl/igUrl/realUrl`
  build the links. The **footer** shows WhatsApp/Telegram/LinkedIn/Instagram, each derived from an
  explicit `social_*` URL if set, else from the handle (links the first line); an icon is dropped
  when it has no real URL (blank or `"#"`). On the **contacts page**, Instagram & LinkedIn are
  single-account rows that appear when *either* the handle field *or* a `social_*` URL is set, so a
  row never vanishes because only one of the two is filled. `Footer` + contacts fetch the one
  `SITE_SETTINGS` query (exported from `directus.ts`) so the build caches the singleton once.
  `social_linkedin` is still `"#"` — set it in the CMS to make the LinkedIn icon/link live.
- **Image uploads:** the admin can upload images for `home_page.hero_image`, `about_page.image`,
  each `cooperation_models.image`, and `team_members.photo`. Pages render the uploaded asset and
  fall back to a `Placeholder` when empty. Added by `directus/add_image_fields.py`. The **services
  hero** and **contacts map** are still placeholders (no field yet).
- Placeholder captions are Russian on every locale — temporary build stubs shown only until an
  image is uploaded (not localised content).
- **Header nav label:** `nav.cooperation` is the short "Сотрудничество"/"Engagement"/"Кызматташуу"
  (the page H1 keeps the full `page.cooperation_title` = "Модели сотрудничества"). The header is
  sized to fit the 1200px bar on one line; the burger menu kicks in below 1240px.
- **"Подробнее →"** on service cards and nav service/model dropdowns link to `/contacts` or `#anchors` — no per-item detail pages exist yet.
- **i18n:** RU/EN/KG is fully wired — the `<LangSwitch>` flag dropdown links to the current path in
  each locale and content/UI strings come from Directus (see the i18n section below). Kyrgyz copy is
  machine-drafted and still flagged for native review.

## i18n (locales: ru, en, ky)

- **Routing:** all locales are path-prefixed — `/ru/…`, `/en/…`, `/ky/…`. The bare `/`
  redirects to `/ru` (`astro.config.mjs` → `redirects`). Pages live under
  `src/pages/[lang]/*.astro`; each calls `export const getStaticPaths = localeStaticPaths`
  and reads `Astro.params.lang`. `src/i18n.ts` holds `LOCALES`, `lp(lang, path)` (locale-prefixed
  links), `localeStaticPaths`, and `getT(lang)`.
- **UI strings live in Directus** (`ui_strings` collection, `key` + `ru`/`en`/`ky` columns) so the
  admin can edit them. `getT(lang)` fetches them (cached) and returns `t(key, vars?)` with RU
  fallback. Add a new string = add a row in the admin + use `t("your.key")`.
- The language switcher (Header) links to the current path in each locale; `<html lang>` is set
  from the active locale.
- **Content** (services, team, documents, page singletons) uses **Directus native Translations**:
  each collection has a `<coll>_translations` junction (FK to the row + `languages_code` + the
  translatable fields) and a `translations` alias on the parent. Pages fetch
  `fields=...,translations.*` and call `tr(translations, lang)` (from `src/i18n.ts`) to pick the
  active locale with RU fallback. Non-translatable fields (slug, icon, sort, status, photo, file,
  phone/email/socials, category) stay on the base collection.
  - **Team member `name`** is translatable too (junction `name` field): RU/KY keep the Cyrillic
    original, EN is transliterated. `team.astro` reads `tr(...).name` and falls back to the base
    `name`. Added by `directus/fix_review_issues.py`.
  - The `/about` "Why choose NORVEX" heading is the `about.why_title` UI string (not hardcoded);
    "NORVEX" is accented client-side via `set:html` (same trick as "HSE" on the home hero).
- The `languages` collection (ru/en/ky) drives the translation language options.
- Kyrgyz strings (UI + content) were machine-drafted — flag for native review.
- **Gotcha:** after changing the schema via the API (e.g. dropping a migrated base column), an
  already-open Directus admin tab caches the old field list and errors ("field … does not
  exist"). Hard-refresh / re-login, or `POST /utils/cache/clear`. The schema itself is fine.

## Directus backend

Collections are set up and seeded (see `directus/README.md`). Public read is enabled, so the
static build can fetch without a token from `http://127.0.0.1:18055`:
- Repeatable: `services`, `cooperation_models`, `team_members`, `document_categories`,
  `documents` (M2O → categories, + file). Singletons: `home_page`, `about_page`, `site_settings`.
- `contact_submissions` accepts public `POST` (wire the contact form to it).
- `icon` field values match this app's `Icon.astro` names. Files: `<base>/assets/<id>`.

## SEO

All page metadata is CMS-editable and emitted from `Layout.astro`:
- **Per-page title + description** live in `ui_strings` as `seo.<page>.title` / `seo.<page>.desc`
  (ru/en/ky), so editors change them in the **UI Strings** collection. Each page passes
  `title={t("seo.X.title")} description={t("seo.X.desc")}` to `Layout`.
- `Layout.astro` builds `<link rel="canonical">`, **hreflang** alternates for ru/en/ky + `x-default`
  (all with trailing slashes, matching Astro's URLs + the sitemap), **Open Graph** + **Twitter**
  cards, and an **Organization JSON-LD** block (name/url/logo + email/phone/Instagram pulled from
  `site_settings`). `og:image`/`twitter:image` use `site_settings.og_image`, falling back to
  `/norvexHero.jpg`.
- `astro.config.mjs` sets `site: https://norvexhse.com` and runs `@astrojs/sitemap` →
  `sitemap-index.xml`; `public/robots.txt` points crawlers at it.
- Setup script: `directus/setup_seo.py` (adds `og_image`, seeds the `seo.*` strings; idempotent).

## Next steps

1. Fetch Directus data in page frontmatter at build time and render the seeded content
   (replace the hardcoded arrays in each page with API results).
2. Replace `Placeholder`s with `directus_files` asset URLs; wire the contact form to
   `POST /items/contact_submissions`.
3. ~~Add EN/KG locales and make the language switcher real.~~ **Done** — `<LangSwitch>` + Directus
   translations are live; remaining i18n work is native review of the Kyrgyz copy.
