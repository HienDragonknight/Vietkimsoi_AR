import { NextResponse } from "next/server";
import { readRegistry } from "@/lib/markers/store";
import type { PublicMarkerConfig } from "@/lib/markers/types";
import { MIND_AR_CONFIG } from "@/config";

/** Public endpoint used by the scan page — no sensitive data. */
export async function GET() {
  const registry = await readRegistry();

  const config: PublicMarkerConfig = {
    targetsMind: registry.targetsMind,
    maxTrack: Math.max(1, Math.min(registry.markers.length, 5)),
    markers: registry.markers.map((m) => ({
      id: m.id,
      label: m.label,
      targetIndex: m.targetIndex,
      videoSrc: m.videoSrc,
      previewImage: m.previewImage,
    })),
  };

  return NextResponse.json(config);
}
