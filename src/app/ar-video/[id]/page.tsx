import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { normalizeMarkerArticle } from "@/lib/markers/article";
import { readRegistry } from "@/lib/markers/store";
import { ArVideoView } from "./ArVideoView";

interface ArVideoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ArVideoPageProps): Promise<Metadata> {
  const { id } = await params;
  const registry = await readRegistry();
  const marker = registry.markers.find((m) => m.id === id);
  const title =
    marker?.article?.articleTitle ?? marker?.label ?? "AR Video";
  return { title };
}

export default async function ArVideoPage({ params }: ArVideoPageProps) {
  const { id } = await params;
  const registry = await readRegistry();
  const marker = registry.markers.find((m) => m.id === id);

  if (!marker) notFound();

  const article = normalizeMarkerArticle(marker.label, marker.article);

  return (
    <ArVideoView
      content={{
        id: marker.id,
        label: marker.label,
        src: marker.videoSrc,
        poster: marker.previewImage,
        article,
      }}
    />
  );
}
