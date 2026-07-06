import type { ArVideoContent } from "@/types";

/** Path fallback when registry has not been loaded yet. */
export const MIND_AR_TARGETS_SRC = "/uploads/targets.mind";

/**
 * Tunables for the MindAR image tracking controller. Marker list and video
 * mapping are managed dynamically via `/admin` → `data/markers.json`.
 */
export const MIND_AR_CONFIG = {
  maxTrack: 1,
  filterMinCF: 0.001,
  filterBeta: 1000,
  warmupTolerance: 5,
  missTolerance: 5,
} as const;

/** @deprecated Use registry via `/api/markers/config` instead. */
export const DEFAULT_AR_VIDEO_CONTENT: ArVideoContent = {
  id: "default",
  title: "Trải nghiệm AR",
  src: "/assets/videos/1.mp4",
};
