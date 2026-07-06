"use client";

import { useEffect, useRef, useState } from "react";
import { MIND_AR_CONFIG } from "@/config";
import type { PublicMarkerConfig } from "@/lib/markers/types";
import type { MindARStatus } from "@/types";

const AFRAME_SRC = "https://aframe.io/releases/1.5.0/aframe.min.js";
const MINDAR_AFRAME_SRC =
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js";

const DEBUG_MINDAR =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

/** Wait this long before locking a target — avoids false index 0 on brief flicker. */
const TARGET_CONFIRM_MS = 450;

function loadClassicScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error(`Không thể tải: ${src}`))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Không thể tải: ${src}`));
    document.head.appendChild(script);
  });
}

interface AframeSceneElement extends HTMLElement {
  systems?: Record<string, { stop?: () => void } | undefined>;
  addEventListener: HTMLElement["addEventListener"];
}

function styleCameraVideos(container: HTMLElement, sceneEl: Element | null) {
  const videos = [
    ...container.querySelectorAll("video"),
    ...(sceneEl?.querySelectorAll("video") ?? []),
  ];
  videos.forEach((video) => {
    video.style.position = "absolute";
    video.style.inset = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.zIndex = "0";
    video.style.visibility = "visible";
    video.style.opacity = "1";
  });
}

function readTargetIndex(el: Element, fallback: number): number {
  // A-Frame may return parsed component data (object) instead of a string.
  const attr = el.getAttribute("mindar-image-target");
  if (attr != null && typeof attr === "object") {
    const idx = (attr as { targetIndex?: number }).targetIndex;
    if (typeof idx === "number" && Number.isFinite(idx)) return idx;
  }
  if (typeof attr === "string") {
    const match = attr.match(/targetIndex:\s*(\d+)/);
    if (match) return Number(match[1]);
  }
  const aframeEl = el as HTMLElement & {
    components?: Record<string, { data?: { targetIndex?: number } }>;
  };
  const idx = aframeEl.components?.["mindar-image-target"]?.data?.targetIndex;
  return typeof idx === "number" && Number.isFinite(idx) ? idx : fallback;
}

/**
 * Boots MindAR AFRAME with dynamic marker config from the admin registry.
 * Confirms target index after a short delay so marker 2 is not overridden
 * by a brief false match on marker 1.
 */
export function useMindARScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: PublicMarkerConfig | null
) {
  const [status, setStatus] = useState<MindARStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedTargetIndex, setDetectedTargetIndex] = useState<number | null>(
    null
  );
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!config || config.markers.length === 0) return;

    let cancelled = false;
    let sceneEl: AframeSceneElement | null = null;
    const container = containerRef.current;

    const activeTargets = new Set<number>();
    let lastSeenIndex: number | null = null;
    let lastSeenLabel = "";
    let confirmTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleConfirm = (index: number, label: string) => {
      lastSeenIndex = index;
      lastSeenLabel = label;
      if (confirmTimer) clearTimeout(confirmTimer);
      setDetectedTargetIndex(null);
      setDetectedLabel(null);
      setStatus("scanning");

      confirmTimer = setTimeout(() => {
        if (cancelled || lastSeenIndex === null) return;
        if (!activeTargets.has(lastSeenIndex)) return;
        if (DEBUG_MINDAR) {
          console.log(
            `[MindAR-aframe] ✅ target ${lastSeenIndex} LOCKED (${lastSeenLabel})`
          );
        }
        setDetectedTargetIndex(lastSeenIndex);
        setDetectedLabel(lastSeenLabel);
        setStatus("found");
      }, TARGET_CONFIRM_MS);
    };

    const onTargetLost = (index: number) => {
      activeTargets.delete(index);
      if (lastSeenIndex === index) {
        lastSeenIndex = null;
        lastSeenLabel = "";
        if (confirmTimer) clearTimeout(confirmTimer);
        setDetectedTargetIndex(null);
        setDetectedLabel(null);
        setStatus("scanning");
      }
    };

    async function boot() {
      if (!container || !config) return;

      try {
        setStatus("loading");
        setErrorMessage(null);
        setDetectedTargetIndex(null);
        setDetectedLabel(null);

        await loadClassicScript(AFRAME_SRC);
        if (cancelled) return;
        await loadClassicScript(MINDAR_AFRAME_SRC);
        if (cancelled) return;

        const maxTrack =
          config.maxTrack ??
          Math.max(1, Math.min(config.markers.length, MIND_AR_CONFIG.maxTrack));

        const targetEntities = config.markers
          .map(
            (m) =>
              `<a-entity id="ar-target-${m.targetIndex}" mindar-image-target="targetIndex: ${m.targetIndex}"></a-entity>`
          )
          .join("\n");

        const mindarAttr =
          `imageTargetSrc: ${config.targetsMind}; ` +
          `maxTrack: ${maxTrack}; ` +
          `filterMinCF: ${MIND_AR_CONFIG.filterMinCF}; ` +
          `filterBeta: ${MIND_AR_CONFIG.filterBeta}; ` +
          `warmupTolerance: ${MIND_AR_CONFIG.warmupTolerance}; ` +
          `missTolerance: ${MIND_AR_CONFIG.missTolerance}; ` +
          `uiScanning: no; uiLoading: no; uiError: no;`;

        container.innerHTML = `
          <a-scene
            mindar-image="${mindarAttr}"
            color-space="sRGB"
            embedded
            renderer="alpha: true; antialias: true; colorManagement: true"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            style="width:100%;height:100%;background:transparent;"
          >
            <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
            ${targetEntities}
          </a-scene>
        `;

        sceneEl = container.querySelector("a-scene");
        if (!sceneEl) throw new Error("Không thể khởi tạo cảnh nhận diện.");

        config.markers.forEach((marker) => {
          const targetEl = container.querySelector(
            `#ar-target-${marker.targetIndex}`
          );
          if (!targetEl) return;

          targetEl.addEventListener("targetFound", () => {
            const idx = readTargetIndex(targetEl, marker.targetIndex);
            activeTargets.add(idx);
            if (DEBUG_MINDAR) {
              console.log(`[MindAR-aframe] target ${idx} found (${marker.label})`);
            }
            scheduleConfirm(idx, marker.label);
          });

          targetEl.addEventListener("targetLost", () => {
            const idx = readTargetIndex(targetEl, marker.targetIndex);
            if (DEBUG_MINDAR) {
              console.log(`[MindAR-aframe] target ${idx} lost`);
            }
            onTargetLost(idx);
          });
        });

        sceneEl.addEventListener("arReady", () => {
          if (cancelled) return;
          styleCameraVideos(container, sceneEl);
          if (DEBUG_MINDAR) {
            console.log(
              `[MindAR-aframe] arReady | markers=${config.markers.length} maxTrack=${maxTrack}`
            );
          }
          setStatus("scanning");
        });

        sceneEl.addEventListener("arError", () => {
          if (cancelled) return;
          setStatus("error");
          setErrorMessage("Không thể khởi động camera nhận diện.");
        });

        setTimeout(() => {
          if (!cancelled) {
            setStatus((s) => (s === "loading" || s === "idle" ? "scanning" : s));
          }
        }, 2500);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể khởi động nhận diện hình ảnh."
        );
        if (DEBUG_MINDAR) console.error("[MindAR-aframe] boot failed", err);
      }
    }

    boot();

    return () => {
      cancelled = true;
      if (confirmTimer) clearTimeout(confirmTimer);
      activeTargets.clear();
      try {
        sceneEl?.systems?.["mindar-image"]?.stop?.();
      } catch {
        // ignore
      }
      if (container) container.innerHTML = "";
    };
  }, [containerRef, config]);

  return { status, errorMessage, detectedTargetIndex, detectedLabel };
}
