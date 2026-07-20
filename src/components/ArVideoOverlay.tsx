"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MarkerArticle } from "@/lib/markers/types";

interface ArVideoOverlayProps {
  label: string;
  videoSrc: string;
  poster?: string;
  article?: MarkerArticle;
  onClose: () => void;
}

/**
 * Clean floating video player displayed directly on top of the live camera stream.
 * Removes all surrounding dark frames/cards and plays video automatically with audio enabled (`muted = false`).
 */
export function ArVideoOverlay({
  label,
  videoSrc,
  poster,
  onClose,
}: ArVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1.0;
    setIsMuted(false);
    setAudioBlocked(false);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[ArVideoOverlay] Autoplay with audio blocked by browser:", err);
        video.muted = true;
        setIsMuted(true);
        setAudioBlocked(true);
        video.play().catch((e) => console.error("Muted fallback play failed:", e));
      });
    }
  }, [videoSrc]);

  const handleToggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      setAudioBlocked(false);
      video.play().catch(() => {});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 pointer-events-none"
    >
      {/* Floating Video Box */}
      <motion.div
        initial={{ scale: 0.88, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.88, y: 15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative w-full max-w-3xl overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-white/20 my-auto"
      >
        {/* Floating Top Controls */}
        <div className="absolute top-3 right-3 left-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`pointer-events-auto flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all shadow-lg ${
              isMuted
                ? "bg-amber-500/90 text-black animate-pulse"
                : "bg-black/45 text-white border border-white/20 hover:bg-black/65"
            }`}
            title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? "Tắt tiếng" : "Có tiếng"}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white border border-white/20 shadow-lg backdrop-blur-md transition hover:bg-black/70 hover:scale-105 active:scale-95"
            aria-label="Đóng video"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Player */}
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          autoPlay
          playsInline
          loop
          className="w-full h-auto max-h-[82dvh] object-cover bg-transparent"
          aria-label={label}
        >
          <track kind="captions" />
        </video>

        {/* Fallback Audio Alert Overlay */}
        <AnimatePresence>
          {audioBlocked && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={handleToggleSound}
              className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-black shadow-xl hover:bg-amber-400 transition transform active:scale-95"
            >
              <VolumeX size={16} />
              <span>Nhấn để bật tiếng 🔊</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
