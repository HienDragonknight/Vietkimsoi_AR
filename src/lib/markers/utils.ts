import type { PublicMarkerConfig } from "@/lib/markers/types";

export function getMarkerIdByTargetIndex(
  config: PublicMarkerConfig,
  targetIndex: number
): string | null {
  const found = config.markers.find((m) => m.targetIndex === targetIndex);
  return found?.id ?? null;
}

export function getMarkerLabelByTargetIndex(
  config: PublicMarkerConfig,
  targetIndex: number
): string {
  const found = config.markers.find((m) => m.targetIndex === targetIndex);
  return found?.label ?? `Marker ${targetIndex + 1}`;
}
