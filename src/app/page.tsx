"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ScanButton } from "@/components/ScanButton";
import { ScanOverlay } from "@/components/ScanOverlay";
import { useMindARScene } from "@/hooks/useMindARScene";
import { ArVideoOverlay } from "@/components/ArVideoOverlay";
import { normalizeMarkerArticle } from "@/lib/markers/article";
import { getMarkerIdByTargetIndex } from "@/lib/markers/utils";
import { needsCameraUserGesture } from "@/lib/device";
import type { PublicMarkerConfig } from "@/lib/markers/types";
import type { ToastMessage } from "@/types";

export default function ScanPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [markerConfig, setMarkerConfig] = useState<PublicMarkerConfig | null>(
    null
  );
  const [configError, setConfigError] = useState<string | null>(null);
  const [needsCameraTap, setNeedsCameraTap] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [bootGeneration, setBootGeneration] = useState(0);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const cameraEnabled = cameraStarted && !!markerConfig;

  const { status: mindARStatus, errorMessage: mindARError, detectedTargetIndex, detectedLabel } =
    useMindARScene(containerRef, markerConfig, cameraEnabled);

  useEffect(() => {
    const needsTap = needsCameraUserGesture();
    setNeedsCameraTap(needsTap);
    if (!needsTap) setCameraStarted(true);
  }, []);

  useEffect(() => {
    fetch("/api/markers/config")
      .then((res) => {
        if (!res.ok) throw new Error("Không tải được cấu hình marker.");
        return res.json();
      })
      .then((data: PublicMarkerConfig) => setMarkerConfig(data))
      .catch((e) =>
        setConfigError(e instanceof Error ? e.message : "Lỗi cấu hình.")
      );
  }, []);

  useEffect(() => {
    if (mindARStatus !== "found" || detectedTargetIndex === null || !markerConfig) {
      return;
    }
    const id = getMarkerIdByTargetIndex(markerConfig, detectedTargetIndex);
    if (id) {
      setActiveMarkerId(id);
      if (typeof window !== "undefined" && window.location.pathname !== `/ar-video/${id}`) {
        window.history.pushState({ arMarkerId: id }, "", `/ar-video/${id}`);
      }
    }
  }, [mindARStatus, detectedTargetIndex, markerConfig]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveMarkerId(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const toast = useMemo<ToastMessage | null>(() => {
    if (configError) {
      return { id: "cfg-error", variant: "error", message: configError };
    }

    switch (mindARStatus) {
      case "idle":
      case "loading":
        return {
          id: "loading",
          variant: "info",
          message: "Đang khởi động nhận diện...",
          messageMobile: "Đang khởi động...",
        };
      case "scanning":
        return {
          id: "scanning",
          variant: "info",
          message: "Di chuyển camera đến gần hình ảnh cần quét",
          messageMobile: "Đưa camera gần ảnh cần quét",
        };
      case "found":
        return {
          id: "found",
          variant: "success",
          message: detectedLabel
            ? `Đã nhận: ${detectedLabel}. Đang mở video...`
            : "Đã tìm thấy hình ảnh! Đang mở video...",
          messageMobile: detectedLabel
            ? `Đã nhận: ${detectedLabel}`
            : "Đã tìm thấy ảnh!",
        };
      case "error":
        return {
          id: "error",
          variant: "error",
          message: mindARError ?? "Không thể nhận diện hình ảnh.",
          messageMobile: needsCameraTap
            ? "Camera lỗi. Nhấn nút bật camera bên dưới."
            : undefined,
        };
      default:
        return null;
    }
  }, [mindARStatus, mindARError, configError, detectedLabel, needsCameraTap]);

  const handleStartCamera = () => {
    setCameraStarted(false);
    setBootGeneration((n) => n + 1);
    requestAnimationFrame(() => setCameraStarted(true));
  };

  const showCameraGate =
    needsCameraTap && !cameraStarted && !configError && !!markerConfig;
  const showLoading =
    !!markerConfig &&
    cameraStarted &&
    (mindARStatus === "idle" || mindARStatus === "loading");
  const showRetryCamera =
    needsCameraTap && mindARStatus === "error" && !!markerConfig;

  const activeMarker = useMemo(() => {
    if (!markerConfig || !activeMarkerId) return null;
    return markerConfig.markers.find((m) => m.id === activeMarkerId) ?? null;
  }, [markerConfig, activeMarkerId]);

  const handleCloseOverlay = () => {
    setActiveMarkerId(null);
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  };

  const handleClose = () => {
    handleCloseOverlay();
  };

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black">
      <div
        key={bootGeneration}
        ref={containerRef}
        className="ar-camera-root absolute inset-0 z-0"
      />

      <AnimatePresence>
        {(!markerConfig || showLoading) && (
          <LoadingScreen key="ar-loading" subtitle="Đang khởi động nhận diện..." />
        )}
      </AnimatePresence>

      {showCameraGate && (
        <div className="absolute inset-0 z-[45] flex flex-col items-center justify-center gap-5 bg-black/90 px-6 text-center text-white">
          <p className="text-[15px] font-medium">Cần bật camera để quét AR</p>
          <p className="max-w-sm text-[13px] text-white/55">
            Trên điện thoại, trình duyệt chỉ mở camera sau khi bạn nhấn nút.
          </p>
          <ScanButton
            onClick={handleStartCamera}
            label="Bật camera & quét"
            className="w-full max-w-xs text-[14px]"
          />
        </div>
      )}

      {!activeMarker && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
          <ScanOverlay
            responsive
            animated={mindARStatus !== "found" && cameraStarted}
            variant={mindARStatus === "found" ? "success" : "normal"}
          />
        </div>
      )}

      {!activeMarker && (
        <div className="safe-bottom absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8">
          {showRetryCamera ? (
            <ScanButton
              onClick={handleStartCamera}
              variant="warning"
              className="w-full max-w-md text-[13px] sm:text-[15px]"
              label="Bật lại camera"
            />
          ) : (
            <ScanButton
              className="w-full max-w-md text-[13px] sm:text-[15px]"
              loading={mindARStatus === "loading" || mindARStatus === "scanning"}
              disabled={true}
              variant={mindARStatus === "found" ? "success" : "normal"}
              label={
                showCameraGate
                  ? "Nhấn nút bật camera ở giữa màn hình"
                  : mindARStatus === "loading" || mindARStatus === "idle"
                  ? "Đang khởi chạy nhận diện..."
                  : mindARStatus === "found"
                  ? "Đã khớp ảnh thành công!"
                  : "Đang tự động quét ảnh..."
              }
            />
          )}
        </div>
      )}

      <AnimatePresence>
        {activeMarker && (
          <ArVideoOverlay
            key={activeMarker.id}
            label={activeMarker.label}
            videoSrc={activeMarker.videoSrc}
            poster={activeMarker.previewImage}
            article={normalizeMarkerArticle(activeMarker.label, activeMarker.article)}
            onClose={handleCloseOverlay}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
