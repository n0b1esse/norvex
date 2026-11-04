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
  return `export const favicon = { href: "/favicon.${extension}", type: "${type}" } as const;\n`;
}
