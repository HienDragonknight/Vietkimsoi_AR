"use client";

import { useRouter } from "next/navigation";
import { CameraView } from "@/components/CameraView";
import { ArVideoOverlay } from "@/components/ArVideoOverlay";
import { useCamera } from "@/hooks/useCamera";
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

/** AR result page: live camera background with overlaid video card and autoplay audio. */
export function ArVideoView({ content }: ArVideoViewProps) {
  const router = useRouter();
  const { videoRef, status, errorMessage, facingMode, retry } = useCamera();

  const handleClose = () => {
    router.replace("/");
  };

  return (
    <CameraView
      videoRef={videoRef}
      status={status}
      errorMessage={errorMessage}
      facingMode={facingMode}
      onRetry={retry}
    >
      <ArVideoOverlay
        label={content.label}
        videoSrc={content.src}
        poster={content.poster}
        article={content.article}
        onClose={handleClose}
      />
    </CameraView>
  );
}

