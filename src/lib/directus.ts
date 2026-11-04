// Minimal Directus client for build-time (static) fetching.
// Public read is enabled on the content collections, so no token is needed.
// Override the base with the DIRECTUS_URL env var (e.g. in Vercel).

export const DIRECTUS_URL = (
  import.meta.env.DIRECTUS_URL ?? "http://127.0.0.1:18055"
).replace(/\/$/, "");

// Dedupe identical GETs within a single build (Header/Footer fetch the same
// collections on every page). Cache lives only for the module's lifetime.
const cache = new Map<string, Promise<unknown>>();

/**
 * Fetch `data` from a Directus REST path. On any failure returns `fallback`
 * (and warns) so a CMS hiccup never breaks the build.
 */
export async function directus<T>(path: string, fallback: T): Promise<T> {
  if (!cache.has(path)) {
    cache.set(path, (async () => {
      try {
        const res = await fetch(`${DIRECTUS_URL}${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return json.data;
      } catch (err) {
        console.warn(`[directus] GET ${path} failed: ${err}. Using fallback.`);
        return undefined;
      }
    })());
  }
  const data = (await cache.get(path)) as T | undefined;
  return data ?? fallback;
}

/** Build an asset URL for a directus_files id, or null. */
export function asset(id?: string | null): string | null {
  return id ? `${DIRECTUS_URL}/assets/${id}` : null;
}

// Shared query fragments
export const PUBLISHED = "filter[status][_eq]=published&sort=sort";

/** Canonical site_settings query. Footer + the contacts page request the SAME path so
    the per-build cache fetches the singleton once, not once per component (the cache is
    keyed by full path, so differing `fields=` lists would otherwise miss). */
export const SITE_SETTINGS =
  "/items/site_settings?fields=" +
  [
    "phone", "whatsapp", "telegram", "email", "instagram", "social_instagram",
    "social_whatsapp", "social_telegram", "linkedin", "social_linkedin", "map_url",
    "translations.languages_code", "translations.footer_tagline",
    "translations.address", "translations.working_hours",
  ].join(",");
