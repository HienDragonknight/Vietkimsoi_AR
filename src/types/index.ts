/**
 * Shared TypeScript types for the AR scan experience.
 */

/** Lifecycle status of the device camera stream. */
export type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

/** Which physical camera is currently active. */
export type CameraFacingMode = "user" | "environment" | "unknown";

/** Result returned by the `useCamera` hook. */
export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  retry: () => void;
  stream: MediaStream | null;
  facingMode: CameraFacingMode;
}

/** Lifecycle status of the MindAR image tracker. */
export type MindARStatus = "idle" | "loading" | "scanning" | "found" | "error";

/** Result returned by the `useMindAR` hook. */
export interface UseMindARResult {
  status: MindARStatus;
  errorMessage: string | null;
  detectedTargetIndex: number | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
}

/** Maps a MindAR target index to a video/content id used by `/ar-video/[id]`. */
export interface MarkerTarget {
  targetIndex: number;
  id: string;
  label: string;
}

/** Metadata describing the playable content for a given marker id. */
export interface ArVideoContent {
  id: string;
  title: string;
  src: string;
  poster?: string;
}

/** Generic status message shown inside `StatusToast`. */
export interface ToastMessage {
  id: string;
  variant: "info" | "error" | "success";
  message: string;
}
