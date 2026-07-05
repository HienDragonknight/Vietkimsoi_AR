import type { ArVideoContent, MarkerTarget } from "@/types";

/** Path to the compiled MindAR image target file (generated with the MindAR compiler). */
export const MIND_AR_TARGETS_SRC = "/assets/targets.mind";

/**
 * Tunables for the MindAR image tracking controller. These mirror MindAR's
 * own defaults (see `Controller` in `mind-ar`), which are well tested for
 * stable detection — avoid straying far from them unless you've profiled
 * real-device behavior, since aggressive filtering can make tracking feel
 * laggy or never "lock on".
 */
export const MIND_AR_CONFIG = {
  targetsSrc: MIND_AR_TARGETS_SRC,
  maxTrack: 1,
  filterMinCF: 0.001,
  filterBeta: 1000,
  warmupTolerance: 5,
  missTolerance: 5,
} as const;

/** Maps every compiled marker (by index inside `targets.mind`) to a content id. */
export const MARKER_TARGETS: MarkerTarget[] = [
  { targetIndex: 0, id: "1", label: "Marker 1" },
];

/** Content shown on the `/ar-video/[id]` page for each marker id. */
export const AR_VIDEO_CONTENT: Record<string, ArVideoContent> = {
  "1": {
    id: "1",
    title: "Trải nghiệm AR 1",
    src: "/assets/videos/1.mp4",
  },
};

/** Fallback content used if an unknown id is requested. */
export const DEFAULT_AR_VIDEO_CONTENT: ArVideoContent = AR_VIDEO_CONTENT["1"];

export function getArVideoContent(id: string): ArVideoContent {
  return AR_VIDEO_CONTENT[id] ?? { ...DEFAULT_AR_VIDEO_CONTENT, id };
}

export function getMarkerRouteId(targetIndex: number): string {
  const found = MARKER_TARGETS.find((m) => m.targetIndex === targetIndex);
  return found?.id ?? String(targetIndex + 1);
}
