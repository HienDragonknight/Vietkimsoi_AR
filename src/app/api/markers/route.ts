import { NextResponse } from "next/server";
import {
  generateMarkerId,
  markerUploadDir,
  publicUrlFromUpload,
  readRegistry,
  reindexMarkers,
  saveUploadedFile,
  writeRegistry,
} from "@/lib/markers/store";
import type { MarkerEntry } from "@/lib/markers/types";
import { defaultArticle, parseArticleFromForm } from "@/lib/markers/article";
import {
  mergeSectionImages,
  pathExt,
  saveVariantFiles,
} from "@/lib/markers/form";

export async function GET() {
  const registry = await readRegistry();
  return NextResponse.json(registry);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const label = String(form.get("label") ?? "").trim();
    if (!label) {
      return NextResponse.json({ error: "Tên chủ đề là bắt buộc." }, { status: 400 });
    }

    const videoFile = form.get("video");
    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return NextResponse.json({ error: "Video là bắt buộc." }, { status: 400 });
    }

    const registry = await readRegistry();
    const id = generateMarkerId();
    const dir = markerUploadDir(id);
    const now = new Date().toISOString();

    const variants = await saveVariantFiles(form, dir);
    const videoExt = pathExt(videoFile.name, ".mp4");
    const videoSrc = publicUrlFromUpload(
      await saveUploadedFile(videoFile, `${dir}/video${videoExt}`)
    );

    const articleBase = parseArticleFromForm(form, defaultArticle(label));
    const article = {
      ...articleBase,
      sections: await mergeSectionImages(form, articleBase.sections, dir),
    };

    const entry: MarkerEntry = {
      id,
      label,
      targetIndex: registry.markers.length * 3,
      targetIndices: [],
      previewImage: variants.withBackground.previewImage,
      sourceImage: variants.withBackground.sourceImage,
      videoSrc,
      variants,
      article,
      createdAt: now,
      updatedAt: now,
    };

    registry.markers = reindexMarkers([...registry.markers, entry]);
    await writeRegistry(registry);

    return NextResponse.json(
      { marker: registry.markers.find((m) => m.id === id), registry },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/markers]", err);
    const message =
      err instanceof Error ? err.message : "Không thể tạo chủ đề.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
