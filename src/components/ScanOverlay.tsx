"use client";

import { motion } from "framer-motion";

type CornerPosition = "tl" | "tr" | "bl" | "br";

interface ScanOverlayProps {
  /** Square size in pixels. Ignored when `fill` is true. */
  size?: number;
  /** Toggles the breathing animation + moving scan line. */
  animated?: boolean;
  /** Toggles the center cross line. */
  showCross?: boolean;
  /** Stretches the corner frame to 100% of its parent instead of a fixed square. */
  fill?: boolean;
  className?: string;
}

const CORNER_LENGTH = 30;

const CORNER_STYLES: Record<CornerPosition, string> = {
  tl: "top-0 left-0 border-t-2 border-l-2 rounded-tl-3xl",
  tr: "top-0 right-0 border-t-2 border-r-2 rounded-tr-3xl",
  bl: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-3xl",
  br: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-3xl",
};

function Corner({ position }: { position: CornerPosition }) {
  return (
    <span
      className={`pointer-events-none absolute border-white/90 ${CORNER_STYLES[position]}`}
      style={{ width: CORNER_LENGTH, height: CORNER_LENGTH }}
    />
  );
}

/**
 * Reusable scan-frame decoration: four corner strokes, an optional center
 * cross and an optional animated scan line. Used both for the live camera
 * scanning frame and as a static decorative overlay on the video page.
 */
export function ScanOverlay({
  size = 280,
  animated = true,
  showCross = true,
  fill = false,
  className = "",
}: ScanOverlayProps) {
  return (
    <motion.div
      className={`pointer-events-none relative ${fill ? "h-full w-full" : ""} ${className}`}
      style={fill ? undefined : { width: size, height: size }}
      animate={animated ? { scale: [1, 1.03, 1] } : undefined}
      transition={
        animated
          ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />

      {showCross && (
        <>
          <span className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-white/55" />
          <span className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 bg-white/55" />
        </>
      )}

      {animated && (
        <motion.div
          className="absolute left-[6%] right-[6%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-white to-transparent"
          style={{ boxShadow: "0 0 12px 2px rgba(255,255,255,0.8)" }}
          initial={{ top: "4%" }}
          animate={{ top: ["4%", "94%", "4%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
