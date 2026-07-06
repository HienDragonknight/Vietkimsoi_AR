"use client";

import { motion } from "framer-motion";

type CornerPosition = "tl" | "tr" | "bl" | "br";

interface ScanOverlayProps {
  /** Square size in pixels. Ignored when `fill` or `responsive` is true. */
  size?: number;
  /** Use viewport-relative sizing for mobile (min(72vw, 280px)). */
  responsive?: boolean;
  /** Toggles the breathing animation + moving scan line. */
  animated?: boolean;
  /** Toggles the center cross line. */
  showCross?: boolean;
  /** Stretches the corner frame to 100% of its parent instead of a fixed square. */
  fill?: boolean;
  className?: string;
  /** Colors of the scanning frame based on scanning status. */
  variant?: "normal" | "warning" | "success";
}

const CORNER_LENGTH = 30;

const CORNER_STYLES: Record<CornerPosition, string> = {
  tl: "top-0 left-0 border-t-2 border-l-2 rounded-tl-3xl",
  tr: "top-0 right-0 border-t-2 border-r-2 rounded-tr-3xl",
  bl: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-3xl",
  br: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-3xl",
};

function Corner({ position, colorClass }: { position: CornerPosition; colorClass: string }) {
  return (
    <span
      className={`pointer-events-none absolute transition-colors duration-500 ${colorClass} ${CORNER_STYLES[position]}`}
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
  responsive = false,
  animated = true,
  showCross = true,
  fill = false,
  className = "",
  variant = "normal",
}: ScanOverlayProps) {
  const colorClass =
    variant === "success"
      ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
      : variant === "warning"
      ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
      : "border-white/90";

  const crossClass =
    variant === "success"
      ? "bg-emerald-500/85"
      : variant === "warning"
      ? "bg-rose-500/85"
      : "bg-white/55";

  const scanlineGradient =
    variant === "success"
      ? "from-transparent via-emerald-400 to-transparent"
      : variant === "warning"
      ? "from-transparent via-rose-400 to-transparent"
      : "from-transparent via-white to-transparent";

  const scanlineShadow =
    variant === "success"
      ? "0 0 12px 2px rgba(16,185,129,0.8)"
      : variant === "warning"
      ? "0 0 12px 2px rgba(244,63,94,0.8)"
      : "0 0 12px 2px rgba(255,255,255,0.8)";

  return (
    <motion.div
      className={`pointer-events-none relative transition-transform duration-500 ${
        fill ? "h-full w-full" : responsive ? "h-[min(72vw,17.5rem)] w-[min(72vw,17.5rem)] sm:h-[280px] sm:w-[280px]" : ""
      } ${className}`}
      style={fill || responsive ? undefined : { width: size, height: size }}
      animate={animated ? { scale: [1, 1.03, 1] } : undefined}
      transition={
        animated
          ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      <Corner position="tl" colorClass={colorClass} />
      <Corner position="tr" colorClass={colorClass} />
      <Corner position="bl" colorClass={colorClass} />
      <Corner position="br" colorClass={colorClass} />

      {showCross && (
        <>
          <span className={`absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${crossClass}`} />
          <span className={`absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 transition-colors duration-500 ${crossClass}`} />
        </>
      )}

      {animated && (
        <motion.div
          className={`absolute left-[6%] right-[6%] h-[2px] rounded-full bg-gradient-to-r ${scanlineGradient}`}
          style={{ boxShadow: scanlineShadow }}
          initial={{ top: "4%" }}
          animate={{ top: ["4%", "94%", "4%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
