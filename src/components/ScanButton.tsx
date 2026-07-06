"use client";

import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";

interface ScanButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  variant?: "normal" | "warning" | "success";
}

/**
 * Glassmorphic pill call-to-action button or automatic status indicator.
 * Displays real-time scanning status and automatically updates colors based on state.
 */
export function ScanButton({
  onClick,
  loading = false,
  disabled = false,
  className = "",
  label,
  variant = "normal",
}: ScanButtonProps) {
  const isInteractive = !!onClick && !disabled;

  const bgStyles =
    variant === "success"
      ? "bg-emerald-500/25 border-emerald-500/50 text-emerald-300"
      : variant === "warning"
      ? "bg-rose-500/25 border-rose-500/50 text-rose-300"
      : "bg-white/[0.12] border-white/25 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
      whileHover={isInteractive ? { y: -4, scale: 1.03 } : undefined}
      whileTap={isInteractive ? { scale: 0.97 } : undefined}
      onClick={isInteractive ? onClick : undefined}
      className={`group flex items-center gap-2.5 rounded-full border px-7 py-3.5 text-[15px] font-medium shadow-glass backdrop-blur-xl transition-all duration-300 ${
        isInteractive ? "cursor-pointer" : "cursor-default"
      } ${bgStyles} ${className}`}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" strokeWidth={2.25} />
      ) : (
        <Camera
          size={20}
          strokeWidth={2.25}
          className={`transition-transform duration-300 ${
            isInteractive ? "group-hover:scale-110" : ""
          }`}
        />
      )}
      <span>{label || (loading ? "Đang tự động quét..." : "Quét ảnh")}</span>
    </motion.div>
  );
}
