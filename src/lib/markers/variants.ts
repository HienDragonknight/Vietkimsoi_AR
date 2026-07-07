import type { MarkerEntry, MarkerImageVariant, MarkerVariants } from "./types";

export const VARIANT_KEYS = [
  "onShirt",
  "noBackground",
  "withBackground",
] as const;

export type VariantKey = (typeof VARIANT_KEYS)[number];

export const VARIANT_LABELS: Record<VariantKey, string> = {
  onShirt: "Logo trên áo",
  noBackground: "Logo không nền",
  withBackground: "Logo có nền",
};

export const VARIANTS_PER_MARKER = VARIANT_KEYS.length;

/** Build placeholder variants from legacy single-image markers. */
export function legacyVariantsFromEntry(
  marker: Pick<MarkerEntry, "sourceImage" | "previewImage">
): MarkerVariants {
  const base = (label: string): MarkerImageVariant => ({
    label,
    sourceImage: marker.sourceImage,
    previewImage: marker.previewImage,
  });
  return {
    onShirt: base(VARIANT_LABELS.onShirt),
    noBackground: base(VARIANT_LABELS.noBackground),
    withBackground: base(VARIANT_LABELS.withBackground),
  };
}

export function normalizeMarkerVariants(
  marker: MarkerEntry
): MarkerVariants {
  if (marker.variants) return marker.variants;
  return legacyVariantsFromEntry(marker);
}

export function normalizeMarkerEntry(marker: MarkerEntry): MarkerEntry {
  const variants = normalizeMarkerVariants(marker);
  const targetIndices =
    marker.targetIndices?.length === VARIANTS_PER_MARKER
      ? marker.targetIndices
      : Array.from({ length: VARIANTS_PER_MARKER }, (_, i) =>
          marker.targetIndex + i
        );

  return {
    ...marker,
    variants,
    targetIndices,
    previewImage: variants.withBackground.previewImage,
    sourceImage: variants.withBackground.sourceImage,
    article: marker.article,
  };
}

/** Ordered compile list: each heritage item contributes 3 source images. */
export function getVariantCompileSources(markers: MarkerEntry[]): Array<{
  markerId: string;
  markerLabel: string;
  variantKey: VariantKey;
  variantLabel: string;
  targetIndex: number;
  sourceImage: string;
}> {
  const sorted = [...markers]
    .map(normalizeMarkerEntry)
    .sort((a, b) => a.targetIndex - b.targetIndex);

  const sources: Array<{
    markerId: string;
    markerLabel: string;
    variantKey: VariantKey;
    variantLabel: string;
    targetIndex: number;
    sourceImage: string;
  }> = [];

  for (const marker of sorted) {
    for (const key of VARIANT_KEYS) {
      const variant = marker.variants[key];
      const targetIndex = marker.targetIndices[VARIANT_KEYS.indexOf(key)];
      sources.push({
        markerId: marker.id,
        markerLabel: marker.label,
        variantKey: key,
        variantLabel: VARIANT_LABELS[key],
        targetIndex,
        sourceImage: variant.sourceImage,
      });
    }
  }

  return sources;
}

export function countCompileTargets(markers: MarkerEntry[]): number {
  return markers.length * VARIANTS_PER_MARKER;
}
