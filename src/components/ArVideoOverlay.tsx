"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import type { MarkerArticle } from "@/lib/markers/types";
import { isYouTubeUrl, getYouTubeEmbedUrl } from "@/lib/video";

interface ArVideoOverlayProps {
  label: string;
  videoSrc: string;
  poster?: string;
  article?: MarkerArticle;
  onClose: () => void;
}

/**
 * Floating vertical portrait video card layered over the live camera background.
 * Video/iframe scales edge-to-edge to eliminate all inner black letterbox bars.
 * Handles mobile browser autoplay constraints by falling back to muted play and providing an explicit Unmute button.
 */
export function ArVideoOverlay({
  label,
  videoSrc,
  poster,
  onClose,
}: ArVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const isYouTube = isYouTubeUrl(videoSrc);
  const embedUrl = isYouTube
    ? getYouTubeEmbedUrl(videoSrc, { autoplay: true, mute: false, loop: true, controls: false })
    : "";

  useEffect(() => {
    if (isYouTube) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1.0;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("[ArVideoOverlay] Autoplay with sound blocked on mobile, fallback to muted:", err);
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [videoSrc, isYouTube]);

  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      setIsMuted(false);
      video.play().catch(() => {});
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-[3px] pointer-events-auto cursor-pointer"
    >
      {/* Floating Vertical Video Card (Portrait 9:16 format) */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="relative w-[92vw] max-w-[460px] sm:max-w-[520px] aspect-[9/16] max-h-[93dvh] overflow-hidden rounded-[36px] shadow-2xl ring-1 ring-white/20 bg-black flex items-center justify-center"
      >
        {/* Top Control Bar: Unmute / Mute toggle and Close button */}
        <div className="absolute top-4 inset-x-4 z-[60] flex items-center justify-between pointer-events-auto">
          {!isYouTube && isMuted && (
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/90 hover:bg-red-600 text-white text-[13px] font-medium backdrop-blur-md shadow-lg animate-pulse transition-all active:scale-95"
            >
              <VolumeX size={16} />
              <span>Nhấn để bật tiếng</span>
            </button>
          )}
          {!isYouTube && !isMuted && (
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white/90 text-[12px] font-medium backdrop-blur-md ring-1 ring-white/20 transition-all active:scale-95"
            >
              <Volume2 size={16} />
              <span>Tắt tiếng</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng video"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-md ring-1 ring-white/20 hover:bg-black/80 hover:text-white transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Content / YouTube Embed */}
        {isYouTube ? (
          <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black">
            <iframe
              src={embedUrl}
              title={label}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={poster}
            autoPlay
            playsInline
            loop
            onClick={toggleMute}
            className="w-full h-full object-cover bg-black cursor-pointer"
            aria-label={label}
          >
            <track kind="captions" />
          </video>
        )}
      </motion.div>
    </motion.div>
  );
}


