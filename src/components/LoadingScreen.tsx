"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

/**
 * Full-screen premium loading state, used while the camera stream is being
 * requested or a video/page transition is in flight.
 */
export function LoadingScreen({
  title = "Đang khởi động camera",
  subtitle = "Vui lòng chờ trong giây lát...",
}: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black text-white"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-white/15"
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
        <Loader2 size={34} strokeWidth={2} className="animate-spin text-white" />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-medium">{title}</p>
        <p className="mt-1 text-[13px] text-white/50">{subtitle}</p>
      </div>
    </motion.div>
  );
}
