// App-level i18n: locales, routing helpers, and the UI-string translator.
// UI strings live in Directus (`ui_strings` collection, ru/en/ky columns), so the
// admin can edit them. Content collections stay RU for now (translated in a later round).
import { directus } from "./lib/directus";

export const LOCALES = ["ru", "en", "ky"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

// Display label (KG is the conventional label for Kyrgyz here) + <html lang> code.
export const LOCALE_LABEL: Record<Locale, string> = { ru: "RU", en: "EN", ky: "KG" };
export const HTML_LANG: Record<Locale, string> = { ru: "ru", en: "en", ky: "ky" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** getStaticPaths for every `[lang]/…` page. */
export function localeStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

/** Locale-prefixed path, e.g. lp("en", "/about") -> "/en/about". */
export function lp(lang: string, path = ""): string {
  return `/${lang}${path}`;
}

/**
 * Pick the translation object for `lang` from a Directus `translations` array,
 * falling back to RU then the first available. Returns {} if none.
 */
export function tr<T = Record<string, any>>(
  translations: Array<{ languages_code: string } & Record<string, any>> | undefined | null,
  lang: string,
): T {
  if (!translations?.length) return {} as T;
  return (
    translations.find((t) => t.languages_code === lang) ??
    translations.find((t) => t.languages_code === "ru") ??
    translations[0]
  ) as T;
}

type Row = { key: string; ru: string; en: string; ky: string };

/** Returns a translator `t(key, vars?)` for the given locale (RU fallback). */
export async function getT(lang: string) {
  const rows = await directus<Row[]>("/items/ui_strings?fields=key,ru,en,ky&limit=-1", []);
  const map = new Map(rows.map((r) => [r.key, (r as Record<string, string>)[lang] || r.ru]));
  return (key: string, vars?: Record<string, string | number>): string => {
    let s = map.get(key) ?? key;
    if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
    return s;
  };
}
