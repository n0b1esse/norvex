import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { faviconDescriptor, manifestSource } from "./favicon-contract.mjs";

const CANDIDATE_EXTENSIONS = ["ico", "png", "svg", "gif", "jpg", "bmp"];
const FALLBACK = { extension: "ico", type: "image/x-icon" };

function faviconPath(rootDir, extension) {
  return join(rootDir, "public", `favicon.${extension}`);
}

async function removeCandidates(rootDir) {
  await Promise.all(
    CANDIDATE_EXTENSIONS.map((extension) => rm(faviconPath(rootDir, extension), { force: true })),
  );
}

async function writeManifest(rootDir, descriptor) {
  const manifest = join(rootDir, "src", "generated", "favicon.ts");
  await mkdir(dirname(manifest), { recursive: true });
  await writeFile(manifest, manifestSource(descriptor));
}

async function useFallback(rootDir) {
  await removeCandidates(rootDir);
  const output = faviconPath(rootDir, FALLBACK.extension);
  await mkdir(dirname(output), { recursive: true });
  await copyFile(join(rootDir, "src", "assets", "favicon-fallback.ico"), output);
  await writeManifest(rootDir, FALLBACK);
  return { href: "/favicon.ico", type: FALLBACK.type, source: "fallback" };
}

function assertOk(response, url) {
  if (!response.ok) {
    throw new Error(`Favicon request failed: ${url} returned HTTP ${response.status}`);
  }
  return response;
}

export async function syncFavicon({
  rootDir,
  directusUrl,
  fetchImpl = fetch,
  logger = console,
}) {
  if (!directusUrl) throw new Error("DIRECTUS_URL is required to sync the CMS favicon");

  const baseUrl = directusUrl.replace(/\/$/, "");
  const settingsUrl = `${baseUrl}/items/site_settings?fields=favicon`;
  let settingsResponse;

  try {
    settingsResponse = await fetchImpl(settingsUrl);
  } catch (error) {
    logger.warn(`[favicon] Could not read CMS settings; using fallback: ${error.message}`);
    return useFallback(rootDir);
  }

  const settings = await assertOk(settingsResponse, settingsUrl).json();

  const fileId = settings.data?.favicon;
  if (!fileId) return useFallback(rootDir);

  const assetUrl = `${baseUrl}/assets/${fileId}`;
  const response = await assertOk(await fetchImpl(assetUrl), assetUrl);
  const contentType = response.headers.get("content-type") ?? "";
  const descriptor = faviconDescriptor(contentType);

  if (!descriptor) {
    throw new Error(`Unsupported favicon MIME type: ${contentType || "missing"}`);
  }

  await removeCandidates(rootDir);
  const output = faviconPath(rootDir, descriptor.extension);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, Buffer.from(await response.arrayBuffer()));
  await writeManifest(rootDir, descriptor);
  return { href: `/favicon.${descriptor.extension}`, type: descriptor.type, source: "cms" };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  syncFavicon({ rootDir: process.cwd(), directusUrl: process.env.DIRECTUS_URL })
    .catch((error) => {
      console.error(`[favicon] ${error.message}`);
      process.exitCode = 1;
    });
}
