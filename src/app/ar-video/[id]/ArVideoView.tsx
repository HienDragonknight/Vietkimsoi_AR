"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import type { ArVideoContent } from "@/types";

interface ArVideoViewProps {
  content: ArVideoContent;
}

/** Full-screen AR result page: black backdrop, centered video, floating back button. */
export function ArVideoView({ content }: ArVideoViewProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black"
    >
      <VideoPlayer src={content.src} poster={content.poster} title={content.title} />

      <div className="safe-top safe-left absolute left-0 top-0 z-50">
        <BackButton onClick={handleBack} />
      </div>
    </motion.main>
  );
}
