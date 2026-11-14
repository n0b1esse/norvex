// Content API client — reads content from the site's own PHP API (MySQL on Hoster).
// The site is fully self-hosted: no external CMS, no third-party requests.
//
// The API lives at /api.php on the same origin and returns JSON:
//   GET /api.php?action=site_settings&lang=ru
//   GET /api.php?action=team&lang=ru
//   GET /api.php?action=services&lang=ru
//   GET /api.php?action=documents&lang=ru
//
// During a static build the API may be unreachable (offline machine); every call
// degrades to a safe empty fallback so the build never fails.

export const API_URL =
  import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://norvexhse.com";

/** Build an absolute URL for a content asset, or null. */
export const asset = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

/** Typed content-API request. Returns parsed JSON, or a safe empty fallback
 *  when the API is unreachable (static builds without network access). */
export const api = async <T = unknown>(
  action: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  const query = new URLSearchParams({ action, ...params });
  const url = `${API_URL}/api.php?${query.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status} for ${url}`);
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch (e) {
    console.warn(`[api] content API unreachable (${url}), returning empty fallback:`, (e as Error).message);
    // Return a shape-safe empty value: array for collection endpoints, object for singletons.
    return ([] as unknown) as T;
  }
};

/** Singleton helper — always returns an object (never an array). */
export const apiOne = async <T extends Record<string, unknown>>(
  action: string,
  params: Record<string, string | number> = {},
): Promise<T> => {
  const data = await api<T | T[]>(action, params);
  if (Array.isArray(data)) return (data[0] ?? {}) as T;
  return (data ?? {}) as T;
};
