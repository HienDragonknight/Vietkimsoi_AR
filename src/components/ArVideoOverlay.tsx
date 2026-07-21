"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
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
 * Includes a transparent overlay blocking direct user interaction with controls.
 */
export function ArVideoOverlay({
  label,
  videoSrc,
  poster,
  onClose,
}: ArVideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
        console.warn("[ArVideoOverlay] Autoplay with sound failed, playing muted fallback:", err);
        video.muted = true;
        video.play().catch(() => {});
      });
    }
  }, [videoSrc, isYouTube]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-black/20 backdrop-blur-[2px] pointer-events-auto cursor-pointer"
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
        {/* Transparent Click-blocking Overlay Layer */}
        <div
          className="absolute inset-0 z-50 bg-transparent select-none cursor-default"
          onClick={onClose}
        />

        {/* Video Content / YouTube Embed at 100% standard size without zooming */}
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
            className="w-full h-full object-cover bg-black"
            aria-label={label}
          >
            <track kind="captions" />
          </video>
        )}
      </motion.div>
    </motion.div>
  );
}


