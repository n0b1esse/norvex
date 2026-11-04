import assert from "node:assert/strict";
import test from "node:test";
import { faviconDescriptor, manifestSource } from "../scripts/favicon-contract.mjs";

test("maps a PNG content type with parameters to a same-origin root file", () => {
  assert.deepEqual(faviconDescriptor("image/png; charset=binary"), {
    extension: "png",
    type: "image/png",
  });
});

test("maps both ICO MIME types to favicon.ico", () => {
  assert.deepEqual(faviconDescriptor("image/vnd.microsoft.icon"), {
    extension: "ico",
    type: "image/x-icon",
  });
  assert.deepEqual(faviconDescriptor("image/x-icon"), {
    extension: "ico",
    type: "image/x-icon",
  });
});

test("rejects unsupported content types", () => {
  assert.equal(faviconDescriptor("application/pdf"), null);
});

test("writes a typed same-origin Astro manifest", () => {
  assert.equal(
    manifestSource({ extension: "svg", type: "image/svg+xml" }),
    'export const favicon = { href: "/favicon.svg", type: "image/svg+xml" } as const;\n',
  );
});
