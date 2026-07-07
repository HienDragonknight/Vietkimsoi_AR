import { promises as fs } from "fs";
import path from "path";
import type { MarkerEntry, MarkerRegistry } from "./types";
import { normalizeMarkerArticle } from "./article";
import {
  VARIANTS_PER_MARKER,
  legacyVariantsFromEntry,
  normalizeMarkerEntry,
} from "./variants";

const DATA_DIR = path.join(process.cwd(), "data");
const REGISTRY_PATH = path.join(DATA_DIR, "markers.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MARKERS_UPLOAD_DIR = path.join(UPLOADS_DIR, "markers");

const DEFAULT_REGISTRY: MarkerRegistry = {
  version: 1,
  targetsMind: "/uploads/targets.mind",
  markers: [],
};

export async function ensureStorageDirs(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(MARKERS_UPLOAD_DIR, { recursive: true });
}

export async function readRegistry(): Promise<MarkerRegistry> {
  await ensureStorageDirs();
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf-8");
    const data = JSON.parse(raw) as MarkerRegistry;
    let markers = (data.markers ?? []).map((m) =>
      normalizeMarkerEntry({
        ...m,
        article: normalizeMarkerArticle(m.label, m.article),
      })
    );

    const needsReindex = markers.some(
      (m, i) => m.targetIndices[0] !== i * VARIANTS_PER_MARKER
    );
    if (needsReindex) {
      markers = reindexMarkers(markers);
      await writeRegistry({ ...data, markers });
    }

    return { ...data, markers };
  } catch {
    return { ...DEFAULT_REGISTRY };
  }
}

export async function writeRegistry(registry: MarkerRegistry): Promise<void> {
  await ensureStorageDirs();
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
}

export function markerUploadDir(id: string): string {
  return path.join(MARKERS_UPLOAD_DIR, id);
}

export async function saveUploadedFile(
  file: File,
  destPath: string
): Promise<string> {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(destPath, buffer);
  return destPath;
}

/** Reassign contiguous targetIndex values — 3 indices per heritage item. */
export function reindexMarkers(markers: MarkerEntry[]): MarkerEntry[] {
  let nextIndex = 0;

  return markers.map((m) => {
    const variants = m.variants ?? legacyVariantsFromEntry(m);
    const targetIndices = Array.from(
      { length: VARIANTS_PER_MARKER },
      (_, i) => nextIndex + i
    );
    nextIndex += VARIANTS_PER_MARKER;

    return normalizeMarkerEntry({
      ...m,
      variants,
      targetIndex: targetIndices[0],
      targetIndices,
      previewImage: variants.withBackground.previewImage,
      sourceImage: variants.withBackground.sourceImage,
      updatedAt: new Date().toISOString(),
    });
  });
}

export function generateMarkerId(): string {
  return `m-${Date.now().toString(36)}`;
}

export function publicUrlFromUpload(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const publicRoot = path.join(process.cwd(), "public").replace(/\\/g, "/");
  if (normalized.startsWith(publicRoot)) {
    return normalized.slice(publicRoot.length);
  }
  return relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
}
