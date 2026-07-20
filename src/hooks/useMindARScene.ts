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

function applyVideoPlaybackAttrs(video: HTMLVideoElement) {
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
}

/** Keep MindAR camera video visible and fill 100% of viewport — especially on mobile devices. */
function styleCameraVideos(container: HTMLElement, sceneEl: Element | null) {
  const videos = [
    ...Array.from(container.querySelectorAll<HTMLVideoElement>("video")),
    ...Array.from(sceneEl?.querySelectorAll<HTMLVideoElement>("video") ?? []),
    ...Array.from(document.querySelectorAll<HTMLVideoElement>(".ar-camera-root video")),
  ];
  videos.forEach((video) => {
    applyVideoPlaybackAttrs(video);
    video.style.setProperty("position", "absolute", "important");
    video.style.setProperty("top", "0", "important");
    video.style.setProperty("left", "0", "important");
    video.style.setProperty("width", "100%", "important");
    video.style.setProperty("height", "100%", "important");
    video.style.setProperty("margin", "0", "important");
    video.style.setProperty("z-index", "2", "important");
    video.style.setProperty("visibility", "visible", "important");
    video.style.setProperty("opacity", "1", "important");
    video.style.setProperty("pointer-events", "none", "important");
    video.style.setProperty("object-fit", "cover", "important");
  });

  const canvases = [
    ...container.querySelectorAll("canvas"),
    ...(sceneEl?.querySelectorAll("canvas") ?? []),
    ...document.querySelectorAll(".ar-camera-root canvas"),
  ];
  canvases.forEach((canvas) => {
    const el = canvas as HTMLCanvasElement;
    el.style.setProperty("position", "absolute", "important");
    el.style.setProperty("top", "0", "important");
    el.style.setProperty("left", "0", "important");
    el.style.setProperty("width", "100%", "important");
    el.style.setProperty("height", "100%", "important");
    el.style.setProperty("z-index", "1", "important");
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("opacity", "0", "important");
  });
}

function triggerMindARResize() {
  window.dispatchEvent(new Event("resize"));
}

async function ensureVideosPlaying(container: HTMLElement, sceneEl: Element | null) {
  const videos = [
    ...container.querySelectorAll("video"),
    ...(sceneEl?.querySelectorAll("video") ?? []),
  ];
  await Promise.all(
    videos.map(async (video) => {
      try {
        await video.play();
      } catch {
        // Retry once — iOS may need playsinline attributes applied first.
        try {
          await video.play();
        } catch {
          // Handled by stream verification below.
        }
      }
    })
  );
}

function hasActiveCameraStream(container: HTMLElement, sceneEl: Element | null): boolean {
  const videos = [
    ...container.querySelectorAll("video"),
    ...(sceneEl?.querySelectorAll("video") ?? []),
  ];
  return Array.from(videos).some((video) => {
    const stream = video.srcObject as MediaStream | null;
    if (!stream) return false;
    return stream
      .getVideoTracks()
      .some((track) => track.readyState === "live" && track.enabled);
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
  config: PublicMarkerConfig | null,
  /** Must be true after a user tap on mobile — getUserMedia requires a gesture. */
  enabled = true
) {
  const [status, setStatus] = useState<MindARStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedTargetIndex, setDetectedTargetIndex] = useState<number | null>(
    null
  );
  const [detectedLabel, setDetectedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !config || config.markers.length === 0) return;

    let cancelled = false;
    let sceneEl: AframeSceneElement | null = null;
    const container = containerRef.current;
    let onResize: (() => void) | null = null;

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
          .flatMap((m) => {
            const indices = m.targetIndices?.length
              ? m.targetIndices
              : [m.targetIndex];
            return indices.map(
              (idx) =>
                `<a-entity id="ar-target-${idx}" mindar-image-target="targetIndex: ${idx}"></a-entity>`
            );
          })
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
            renderer="alpha: true; antialias: true; colorManagement: true; preserveDrawingBuffer: true"
            background="color: transparent"
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

        onResize = () => styleCameraVideos(container, sceneEl);
        window.addEventListener("resize", onResize);

        config.markers.forEach((marker) => {
          const indices = marker.targetIndices?.length
            ? marker.targetIndices
            : [marker.targetIndex];

          indices.forEach((idx) => {
            const targetEl = container.querySelector(`#ar-target-${idx}`);
            if (!targetEl) return;

            targetEl.addEventListener("targetFound", () => {
              const parsedIdx = readTargetIndex(targetEl, idx);
              activeTargets.add(parsedIdx);
              if (DEBUG_MINDAR) {
                console.log(
                  `[MindAR-aframe] target ${parsedIdx} found (${marker.label})`
                );
              }
              scheduleConfirm(parsedIdx, marker.label);
            });

            targetEl.addEventListener("targetLost", () => {
              const parsedIdx = readTargetIndex(targetEl, idx);
              if (DEBUG_MINDAR) {
                console.log(`[MindAR-aframe] target ${parsedIdx} lost`);
              }
              onTargetLost(parsedIdx);
            });
          });
        });

        sceneEl.addEventListener("arReady", () => {
          if (cancelled) return;

          void (async () => {
            triggerMindARResize();
            styleCameraVideos(container, sceneEl);
            await ensureVideosPlaying(container, sceneEl);

            if (!hasActiveCameraStream(container, sceneEl)) {
              await new Promise((r) => setTimeout(r, 900));
            }
            triggerMindARResize();
            styleCameraVideos(container, sceneEl);
            await ensureVideosPlaying(container, sceneEl);

            if (cancelled) return;

            if (!hasActiveCameraStream(container, sceneEl)) {
              setStatus("error");
              setErrorMessage(
                "Camera chưa bật. Trên điện thoại hãy nhấn nút bật camera, dùng Safari/Chrome và cho phép quyền Camera."
              );
              return;
            }

            if (DEBUG_MINDAR) {
              console.log(
                `[MindAR-aframe] arReady | markers=${config.markers.length} maxTrack=${maxTrack}`
              );
            }
            setStatus("scanning");
          })();
        });

        sceneEl.addEventListener("arError", () => {
          if (cancelled) return;
          setStatus("error");
          setErrorMessage(
            "Không thể khởi động camera. Hãy kiểm tra quyền Camera trong Cài đặt trình duyệt."
          );
        });
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
      if (onResize) window.removeEventListener("resize", onResize);
      try {
        sceneEl?.systems?.["mindar-image"]?.stop?.();
        const renderer = (
          sceneEl as unknown as {
            renderer?: { dispose?: () => void; forceContextLoss?: () => void };
          }
        )?.renderer;
        renderer?.dispose?.();
        renderer?.forceContextLoss?.();
      } catch {
        // ignore
      }
      if (container) container.innerHTML = "";
    };
  }, [containerRef, config, enabled]);

  return { status, errorMessage, detectedTargetIndex, detectedLabel };
}
