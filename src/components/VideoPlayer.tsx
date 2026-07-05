"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { ScanOverlay } from "./ScanOverlay";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

/**
 * Large, responsive, aspect-ratio-locked video with rounded corners, a
 * fade/scale-in entrance and decorative scan-corner overlay.
 */
export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative aspect-video w-[92vw] max-w-4xl overflow-hidden rounded-3xl bg-neutral-950 shadow-glass-lg ring-1 ring-white/10 md:w-[82vw] lg:w-[70vw]"
    >
      <video
        src={src}
        poster={poster}
        autoPlay
        controls
        playsInline
        loop
        onLoadedData={() => setIsLoaded(true)}
        className="h-full w-full rounded-3xl bg-black object-contain"
        aria-label={title}
      >
        <track kind="captions" />
      </video>

      {!isLoaded && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isLoaded ? 0 : 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black"
        >
          <Loader2 size={32} className="animate-spin text-white/70" />
        </motion.div>
      )}

      <div className="pointer-events-none absolute inset-3 sm:inset-4">
        <ScanOverlay fill animated={false} showCross={false} />
      </div>
    </motion.div>
  );
}
