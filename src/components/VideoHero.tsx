"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { isYouTubeUrl, getYouTubeEmbedUrl } from "@/lib/video";

interface VideoHeroProps {
  src: string;
  poster?: string;
  title?: string;
}

/** Full-width video hero for the top of the AR content page. */
export function VideoHero({ src, poster, title }: VideoHeroProps) {
  const [loaded, setLoaded] = useState(false);
  const isYouTube = isYouTubeUrl(src);
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(src, { autoplay: true }) : "";

  return (
    <div className="relative w-full bg-black">
      <div className="relative mx-auto aspect-video w-full max-h-[min(50dvh,56.25vw)] sm:max-h-[min(55dvh,56.25vw)]">
        {isYouTube ? (
          <iframe
            src={embedUrl}
            title={title ?? "Video"}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            <video
              src={src}
              poster={poster}
              autoPlay
              controls
              playsInline
              loop
              onLoadedData={() => setLoaded(true)}
              className="h-full w-full object-cover"
              aria-label={title}
            >
              <track kind="captions" />
            </video>

            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 size={28} className="animate-spin text-white/70" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

