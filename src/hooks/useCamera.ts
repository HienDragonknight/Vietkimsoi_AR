"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraFacingMode, CameraStatus, UseCameraResult } from "@/types";

/**
 * Requests the rear-facing ("environment") camera — required so the device
 * can actually see a printed marker held up in front of it — attaches it to
 * a `<video>` element, and exposes a small state machine so the UI can
 * gracefully render loading, permission-denied and unavailable-device
 * states. Falls back to whatever camera is available (e.g. a laptop webcam,
 * which is always front-facing) and reports the resolved facing mode so the
 * UI can mirror the preview only when appropriate.
 */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>("unknown");
  const [attempt, setAttempt] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("requesting");
      setErrorMessage(null);

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setStatus("unavailable");
          setErrorMessage("Thiết bị này không hỗ trợ truy cập camera.");
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const [track] = stream.getVideoTracks();
        const resolvedFacingMode = track?.getSettings().facingMode;
        setFacingMode(
          resolvedFacingMode === "user" || resolvedFacingMode === "environment"
            ? resolvedFacingMode
            : "unknown"
        );

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;

        const domError = err as DOMException;
        if (
          domError?.name === "NotAllowedError" ||
          domError?.name === "PermissionDeniedError"
        ) {
          setStatus("denied");
          setErrorMessage("Bạn đã từ chối quyền truy cập camera.");
        } else if (
          domError?.name === "NotFoundError" ||
          domError?.name === "DevicesNotFoundError"
        ) {
          setStatus("unavailable");
          setErrorMessage("Không tìm thấy camera trên thiết bị này.");
        } else {
          setStatus("error");
          setErrorMessage("Không thể khởi động camera. Vui lòng thử lại.");
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [attempt, stopStream]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    videoRef,
    status,
    errorMessage,
    retry,
    stream: streamRef.current,
    facingMode,
  };
}
