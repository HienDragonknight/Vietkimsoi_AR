"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CameraOff, RefreshCw, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { CameraFacingMode, CameraStatus } from "@/types";
import { LoadingScreen } from "./LoadingScreen";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  facingMode: CameraFacingMode;
  onRetry: () => void;
  children?: ReactNode;
}

/**
 * Full-viewport camera background. Renders the live feed once ready, or a
 * friendly fallback state (loading / permission denied / unavailable). Only
 * mirrors the preview when the active camera is front-facing (e.g. a laptop
 * webcam) — the rear camera used for scanning must stay unmirrored so the
 * user sees the marker exactly as the tracker does.
 */
export function CameraView({
  videoRef,
  status,
  errorMessage,
  facingMode,
  onRetry,
  children,
}: CameraViewProps) {
  const isReady = status === "ready";
  const isBlocked = status === "denied" || status === "unavailable" || status === "error";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
        style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
      />

      <AnimatePresence>
        {status === "requesting" && <LoadingScreen key="loading" />}
        {isBlocked && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-black/95 px-8 text-center text-white"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              {status === "denied" ? (
                <ShieldAlert size={30} strokeWidth={1.75} />
              ) : (
                <CameraOff size={30} strokeWidth={1.75} />
              )}
            </div>
            <div>
              <p className="text-[16px] font-semibold">Không thể mở camera</p>
              <p className="mx-auto mt-1.5 max-w-[280px] text-[13.5px] leading-relaxed text-white/55">
                {errorMessage ?? "Đã xảy ra lỗi không xác định."}
              </p>
            </div>
            <motion.button
              type="button"
              onClick={onRetry}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-medium backdrop-blur-md transition-colors hover:bg-white/15"
            >
              <RefreshCw size={16} />
              Thử lại
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {isReady && children}
    </div>
  );
}
