/**
 * Client-side MindAR image compiler (official browser API).
 * See: https://hiukim.github.io/mind-ar-js-doc/core-api/
 */

const MINDAR_IMAGE_SRC =
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";

interface MindARCompiler {
  compileImageTargets: (
    images: HTMLImageElement[],
    onProgress?: (progress: number) => void
  ) => Promise<unknown>;
  exportData: () => Promise<ArrayBuffer>;
}

declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Compiler?: new () => MindARCompiler;
      };
    };
  }
}

let compilerScriptPromise: Promise<void> | null = null;

export function loadMindARCompiler(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Compiler chỉ chạy trên trình duyệt."));
  }
  if (window.MINDAR?.IMAGE?.Compiler) return Promise.resolve();
  if (compilerScriptPromise) return compilerScriptPromise;

  compilerScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${MINDAR_IMAGE_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Không tải được MindAR compiler."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = MINDAR_IMAGE_SRC;
    script.type = "module";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không tải được MindAR compiler."));
    document.head.appendChild(script);
  });

  return compilerScriptPromise;
}

export async function loadImageFromUrl(
  url: string,
  maxDimension = 800
): Promise<HTMLImageElement> {
  const absolute = url.startsWith("http")
    ? url
    : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error(`Không tải được ảnh: ${url}`));
    i.src = absolute;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // If already under max dimension, return original image
  if (width <= maxDimension && height <= maxDimension) {
    return img;
  }

  // Downscale image via HTML Canvas to avoid WebGL GL_OUT_OF_MEMORY VRAM crashes
  const scale = maxDimension / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) return img;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise<HTMLImageElement>((resolve) => {
    const resized = new Image();
    resized.crossOrigin = "anonymous";
    resized.onload = () => resolve(resized);
    resized.src = canvas.toDataURL("image/jpeg", 0.9);
  });
}

/**
 * Compile marker source images into a `.mind` buffer using MindAR's official
 * browser Compiler API. Image order must match `targetIndex` (0, 1, 2...).
 * Automatically resizes target images to max 800px dimension to prevent WebGL GL_OUT_OF_MEMORY.
 */
export async function compileMarkersToMind(
  imageUrls: string[],
  onProgress?: (progress: number) => void
): Promise<ArrayBuffer> {
  await loadMindARCompiler();

  const Compiler =
    window.MINDAR?.IMAGE?.Compiler ??
    (window.MINDAR as { Compiler?: new () => MindARCompiler } | undefined)
      ?.Compiler;
  if (!Compiler) {
    throw new Error("MindAR Compiler không khả dụng.");
  }

  // Downscale high-resolution images to 800px max dimension before feeding to WebGL
  const images = await Promise.all(
    imageUrls.map((url) => loadImageFromUrl(url, 800))
  );
  const compiler = new Compiler();

  await compiler.compileImageTargets(images, (p) => {
    onProgress?.(p);
  });

  return compiler.exportData();
}

/** MindAR reports 0–1 on some builds and 0–100 on others — normalize to 0–100. */
export function normalizeCompilerProgress(raw: number): number {
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(Math.min(raw, 100));
}
