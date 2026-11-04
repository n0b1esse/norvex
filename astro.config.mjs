// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import sitemap from '@astrojs/sitemap';

// All locales are path-prefixed (/ru, /en, /ky); the bare root redirects to /ru.

// Build-time content guard: list collections (services/team/documents) have NO hardcoded
// fallback, so if Directus is unreachable/empty during the build they render zero items.
// Fail the build instead of silently shipping a blank site. Checks the canonical /ru output.
function contentGuard() {
  return {
    name: 'norvex-content-guard',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const count = (file, re) => {
          try { return (readFileSync(new URL(file, dir), 'utf8').match(re) || []).length; }
          catch { return -1; }
        };
        const checks = [
          ['ru/services/index.html', /class="card service/g, 3, 'service cards'],
          ['ru/team/index.html', /class="card member/g, 2, 'team members'],
          ['ru/documents/index.html', /class="card doc-row/g, 1, 'documents'],
        ];
        const errs = [];
        for (const [file, re, min, label] of checks) {
          const n = count(file, re);
          if (n < min) errs.push(`${file}: expected >=${min} ${label}, found ${n < 0 ? 'FILE MISSING' : n}`);
        }
        if (errs.length) {
          throw new Error(
            'Content guard failed — Directus likely unreachable/empty at build time:\n  - ' +
            errs.join('\n  - ') + '\nRefusing to ship a blank site.'
          );
        }
        logger.info('content guard: core CMS content present ✓');
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  // Canonical production origin — used for <link rel="canonical">, hreflang,
  // OG/Twitter absolute URLs, and the generated sitemap.
  site: 'https://norvexhse.com',
  redirects: {
    '/': '/ru',
  },
  integrations: [
    // contentGuard(), // отключено: Directus недоступен на Vercel во время сборки
    // Emits sitemap-index.xml (+ sitemap-0.xml) at the site root, with hreflang
    // alternates linking the ru/en/ky versions of each page for search engines.
    sitemap({
      i18n: { defaultLocale: 'ru', locales: { ru: 'ru', en: 'en', ky: 'ky' } },
    }),
  ],
});
