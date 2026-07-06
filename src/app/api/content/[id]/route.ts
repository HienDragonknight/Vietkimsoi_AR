import { NextResponse } from "next/server";
import { readRegistry } from "@/lib/markers/store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Resolve video content for `/ar-video/[id]`. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const registry = await readRegistry();
  const marker = registry.markers.find((m) => m.id === id);

  if (!marker) {
    return NextResponse.json({ error: "Không tìm thấy nội dung." }, { status: 404 });
  }

  return NextResponse.json({
    id: marker.id,
    title: marker.label,
    src: marker.videoSrc,
    poster: marker.previewImage,
    article: marker.article,
  });
}
