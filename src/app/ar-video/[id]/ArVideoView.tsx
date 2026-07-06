"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArticleContent } from "@/components/ArticleContent";
import { BackButton } from "@/components/BackButton";
import { VideoHero } from "@/components/VideoHero";
import type { MarkerArticle } from "@/lib/markers/types";

export interface ArPageContent {
  id: string;
  label: string;
  src: string;
  poster?: string;
  article: MarkerArticle;
}

interface ArVideoViewProps {
  content: ArPageContent;
}

/** AR result page: video hero on top, scrollable article below. */
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-[#FFF9F1]"
    >
      <div className="relative">
        <VideoHero
          src={content.src}
          poster={content.poster}
          title={content.label}
        />
        <div className="safe-top safe-left absolute left-0 top-0 z-20 p-3 sm:p-4">
          <BackButton onClick={handleBack} />
        </div>
      </div>

      <ArticleContent article={content.article} />
    </motion.div>
  );
}
