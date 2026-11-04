// Build contact/social URLs from CMS-stored handles. Shared by Footer + contacts page.
// Each returns null when there's nothing usable, so callers can drop dead links.

/** A real URL, or null for blank / "#" placeholders. */
export const realUrl = (u?: string | null): string | null =>
  u && u.trim() && u.trim() !== "#" ? u.trim() : null;

/** tel: link from a phone number (keeps digits and a leading +). */
export const telUrl = (n?: string | null): string | null => {
  const d = (n ?? "").replace(/[^\d+]/g, "");
  return d ? `tel:${d}` : null;
};

/** wa.me link from a phone number (digits only). */
export const waUrl = (n?: string | null): string | null => {
  const d = (n ?? "").replace(/\D/g, "");
  return d ? `https://wa.me/${d}` : null;
};

/** t.me link from a @handle or a full t.me URL. */
export const tgUrl = (h?: string | null): string | null => {
  const u = (h ?? "").trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
  return u ? `https://t.me/${u}` : null;
};

/** instagram.com link from a @handle or full URL. */
export const igUrl = (h?: string | null): string | null => {
  const u = (h ?? "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  return u ? `https://www.instagram.com/${u}` : null;
};

/** mailto: link from an address. */
export const mailUrl = (e?: string | null): string | null => {
  const v = (e ?? "").trim();
  return v ? `mailto:${v}` : null;
};

/** Split a multiline CMS field into trimmed, non-empty values (one per line).
    Contact fields can hold several values, one per line; Footer + contacts share this. */
export const lines = (v?: string | null): string[] =>
  (v ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
