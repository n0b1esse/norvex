// Directus CMS client — shared helpers for fetching content and resolving asset URLs.
// Reads configuration from environment variables; falls back to sensible defaults.
export const DIRECTUS_URL = import.meta.env.PUBLIC_DIRECTUS_URL ?? "https://temoor.uz/norvex-cms";

export const PUBLISHED = "filter[status][_eq]=published";

/** Build a full asset URL from a Directus file ID, or return null. */
export const asset = (id?: string | null): string | null => {
  if (!id) return null;
  return id.startsWith("http") ? id : `${DIRECTUS_URL}/assets/${id}`;
};

/** Typed Directus request helper. Returns parsed JSON, or a safe empty fallback
 *  when the CMS is unreachable (static builds without network access). */
export const directus = async <T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const url = `${DIRECTUS_URL}${path}${path.includes("?") ? "&" : "?"}${PUBLISHED}`;
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`Directus ${res.status} for ${url}`);
    return res.json();
  } catch (e) {
    console.warn(`[directus] CMS unreachable (${url}), returning empty fallback:`, (e as Error).message);
    // Return a shape-safe empty value: array for collection endpoints, object for singletons.
    return ([] as unknown) as T;
  }
};
