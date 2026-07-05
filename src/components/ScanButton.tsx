"use client";

import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";

interface ScanButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Glassmorphic pill call-to-action button used to trigger MindAR scanning.
 */
export function ScanButton({
  onClick,
  loading = false,
  disabled = false,
  className = "",
}: ScanButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
      whileHover={disabled ? undefined : { y: -4, scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`group flex items-center gap-2.5 rounded-full border border-white/35 bg-white/[0.18] px-7 py-3.5 text-[15px] font-medium text-white shadow-glass backdrop-blur-xl transition-shadow disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <Loader2 size={20} className="animate-spin" strokeWidth={2.25} />
      ) : (
        <Camera
          size={20}
          strokeWidth={2.25}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      )}
      <span>{loading ? "Đang quét..." : "Quét ảnh"}</span>
    </motion.button>
  );
}
