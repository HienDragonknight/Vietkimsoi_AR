"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

/** Rounded white glass pill that floats over the video, top-left. */
export function BackButton({ onClick, className = "" }: BackButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={`flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-[14px] font-medium text-neutral-900 shadow-glass backdrop-blur-md transition-shadow hover:shadow-glass-lg ${className}`}
    >
      <ArrowLeft size={18} strokeWidth={2.25} />
      <span>Quay lại</span>
    </motion.button>
  );
}
