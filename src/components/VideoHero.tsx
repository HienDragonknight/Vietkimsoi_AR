"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

interface VideoHeroProps {
  src: string;
  poster?: string;
  title?: string;
}

/** Full-width video hero for the top of the AR content page. */
export function VideoHero({ src, poster, title }: VideoHeroProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full bg-black">
      <div className="relative mx-auto aspect-video w-full max-h-[min(50dvh,56.25vw)] sm:max-h-[min(55dvh,56.25vw)]">
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
      </div>
    </div>
  );
}
