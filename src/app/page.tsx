"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { CameraView } from "@/components/CameraView";
import { CloseButton } from "@/components/CloseButton";
import { ScanButton } from "@/components/ScanButton";
import { ScanOverlay } from "@/components/ScanOverlay";
import { StatusToast } from "@/components/StatusToast";
import { getMarkerRouteId } from "@/config";
import { useCamera } from "@/hooks/useCamera";
import { useMindAR } from "@/hooks/useMindAR";
import type { ToastMessage } from "@/types";

export default function ScanPage() {
  const router = useRouter();
  const {
    videoRef,
    status: cameraStatus,
    errorMessage: cameraError,
    retry,
    facingMode,
  } = useCamera();
  const {
    status: mindARStatus,
    errorMessage: mindARError,
    detectedTargetIndex,
    startScanning,
  } = useMindAR(videoRef);

  useEffect(() => {
    if (mindARStatus !== "found" || detectedTargetIndex === null) return;

    const id = getMarkerRouteId(detectedTargetIndex);
    const timer = setTimeout(() => {
      router.push(`/ar-video/${id}`);
    }, 900);

    return () => clearTimeout(timer);
  }, [mindARStatus, detectedTargetIndex, router]);

  const toast = useMemo<ToastMessage | null>(() => {
    switch (mindARStatus) {
      case "loading":
        return { id: "loading", variant: "info", message: "Đang khởi động nhận diện..." };
      case "scanning":
        return {
          id: "scanning",
          variant: "info",
          message: "Di chuyển camera đến gần hình ảnh cần quét",
        };
      case "found":
        return {
          id: "found",
          variant: "success",
          message: "Đã tìm thấy hình ảnh! Đang mở video...",
        };
      case "error":
        return {
          id: "error",
          variant: "error",
          message: mindARError ?? "Không thể nhận diện hình ảnh.",
        };
      default:
        return null;
    }
  }, [mindARStatus, mindARError]);

  const handleClose = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    }
  };

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-black">
      <CameraView
        videoRef={videoRef}
        status={cameraStatus}
        errorMessage={cameraError}
        facingMode={facingMode}
        onRetry={retry}
      >
        <StatusToast toast={toast} />

        <div className="absolute inset-0 flex items-center justify-center">
          <ScanOverlay size={280} animated={mindARStatus !== "found"} />
        </div>

        <div className="safe-bottom absolute inset-x-0 bottom-0 flex justify-center pb-8">
          <ScanButton
            onClick={startScanning}
            loading={mindARStatus === "loading" || mindARStatus === "scanning"}
            disabled={mindARStatus === "loading" || mindARStatus === "scanning" || mindARStatus === "found"}
          />
        </div>
      </CameraView>

      <div className="safe-top safe-right absolute right-0 top-0 z-50">
        <CloseButton onClick={handleClose} />
      </div>
    </main>
  );
}
