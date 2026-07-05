"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Circular translucent close button, meant to sit top-right over the camera
 * feed inside the device's safe area.
 */
export function CloseButton({ onClick, className = "" }: CloseButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Đóng"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.55)" }}
      whileTap={{ scale: 0.92 }}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white shadow-glass backdrop-blur-md transition-colors ${className}`}
    >
      <X size={22} strokeWidth={2.25} />
    </motion.button>
  );
}
