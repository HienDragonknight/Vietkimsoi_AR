"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MIND_AR_CONFIG } from "@/config";
import type { MindARStatus, UseMindARResult } from "@/types";

const MINDAR_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";

interface MindARUpdateEvent {
  type: "updateMatrix" | "processDone";
  targetIndex?: number;
  worldMatrix?: number[] | null;
}

interface MindARControllerOptions {
  inputWidth: number;
  inputHeight: number;
  maxTrack?: number;
  filterMinCF?: number;
  filterBeta?: number;
  warmupTolerance?: number;
  missTolerance?: number;
  onUpdate?: (event: MindARUpdateEvent) => void;
}

interface MindARAddTargetsResult {
  dimensions: [number, number][];
}

interface MindARController {
  addImageTargets: (url: string) => Promise<MindARAddTargetsResult>;
  dummyRun: (input: HTMLVideoElement) => void;
  processVideo: (input: HTMLVideoElement) => void;
  stopProcessVideo: () => void;
  dispose: () => void;
}

declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Controller: new (options: MindARControllerOptions) => MindARController;
      };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadMindARScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("MindAR chỉ chạy được trên trình duyệt."));
  }
  if (window.MINDAR?.IMAGE) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MINDAR_SCRIPT_SRC}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Không thể tải thư viện nhận diện."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = MINDAR_SCRIPT_SRC;
    script.type = "module";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải thư viện nhận diện."));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve();

  return new Promise((resolve) => {
    const onReady = () => {
      if (video.videoWidth > 0) {
        video.removeEventListener("loadeddata", onReady);
        resolve();
      }
    };
    video.addEventListener("loadeddata", onReady);
  });
}

/**
 * Loads MindAR's image-tracking engine (browser bundle) and runs it against
 * a live `<video>` element, reporting when a compiled marker is detected.
 */
export function useMindAR(
  videoRef: React.RefObject<HTMLVideoElement | null>
): UseMindARResult {
  const [status, setStatus] = useState<MindARStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedTargetIndex, setDetectedTargetIndex] = useState<number | null>(
    null
  );
  const controllerRef = useRef<MindARController | null>(null);
  const foundRef = useRef(false);

  const stopScanning = useCallback(() => {
    controllerRef.current?.stopProcessVideo();
  }, []);

  const startScanning = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      setStatus("error");
      setErrorMessage("Camera chưa sẵn sàng, vui lòng thử lại.");
      return;
    }

    try {
      setStatus("loading");
      setErrorMessage(null);
      foundRef.current = false;
      setDetectedTargetIndex(null);

      await loadMindARScript();
      await waitForVideoReady(video);

      const IMAGE = window.MINDAR?.IMAGE;
      if (!IMAGE) throw new Error("Không thể khởi tạo thư viện nhận diện.");

      controllerRef.current?.dispose();

      const controller = new IMAGE.Controller({
        inputWidth: video.videoWidth || 1280,
        inputHeight: video.videoHeight || 720,
        maxTrack: MIND_AR_CONFIG.maxTrack,
        filterMinCF: MIND_AR_CONFIG.filterMinCF,
        filterBeta: MIND_AR_CONFIG.filterBeta,
        warmupTolerance: MIND_AR_CONFIG.warmupTolerance,
        missTolerance: MIND_AR_CONFIG.missTolerance,
        onUpdate: (event) => {
          if (process.env.NODE_ENV !== "production" && event.type === "updateMatrix") {
            console.debug(
              `[useMindAR] target ${event.targetIndex} ${
                event.worldMatrix ? "LOCKED (showing)" : "lost/not showing"
              }`
            );
          }

          if (
            event.type === "updateMatrix" &&
            event.worldMatrix &&
            !foundRef.current
          ) {
            foundRef.current = true;
            setDetectedTargetIndex(event.targetIndex ?? 0);
            setStatus("found");
          }
        },
      });

      controllerRef.current = controller;

      const { dimensions } = await controller.addImageTargets(
        MIND_AR_CONFIG.targetsSrc
      );

      if (process.env.NODE_ENV !== "production") {
        console.debug(
          `[useMindAR] loaded ${dimensions.length} target(s), dims=${JSON.stringify(
            dimensions
          )}, video=${video.videoWidth}x${video.videoHeight}`
        );
      }

      controller.dummyRun(video);
      setStatus("scanning");
      controller.processVideo(video);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Không thể khởi động nhận diện hình ảnh."
      );
      if (process.env.NODE_ENV !== "production") {
        console.error("[useMindAR] startScanning failed", err);
      }
    }
  }, [videoRef]);

  useEffect(() => {
    return () => {
      controllerRef.current?.stopProcessVideo();
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return { status, errorMessage, detectedTargetIndex, startScanning, stopScanning };
}
