import { NextResponse } from "next/server";
import { readRegistry } from "@/lib/markers/store";
import type { PublicMarkerConfig } from "@/lib/markers/types";
import { countCompileTargets } from "@/lib/markers/variants";

/** Public endpoint used by the scan page — no sensitive data. */
export async function GET() {
  const registry = await readRegistry();
  const totalTargets = countCompileTargets(registry.markers);

  const config: PublicMarkerConfig = {
    targetsMind: registry.targetsMind,
    maxTrack: Math.max(1, Math.min(totalTargets, 20)),
    markers: registry.markers.map((m) => ({
      id: m.id,
      label: m.label,
      targetIndex: m.targetIndex,
      targetIndices: m.targetIndices,
      videoSrc: m.videoSrc,
      previewImage: m.previewImage,
      article: m.article,
    })),
  };

  return NextResponse.json(config);
}
