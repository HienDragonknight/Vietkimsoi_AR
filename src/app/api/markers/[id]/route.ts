import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import {
  markerUploadDir,
  readRegistry,
  reindexMarkers,
  saveUploadedFile,
  writeRegistry,
  publicUrlFromUpload,
} from "@/lib/markers/store";
import { parseArticleFromForm } from "@/lib/markers/article";
import {
  mergeSectionImages,
  pathExt,
  saveVariantFiles,
} from "@/lib/markers/form";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const registry = await readRegistry();
  const marker = registry.markers.find((m) => m.id === id);
  if (!marker) {
    return NextResponse.json({ error: "Không tìm thấy chủ đề." }, { status: 404 });
  }
  return NextResponse.json(marker);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const registry = await readRegistry();
    const index = registry.markers.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Không tìm thấy chủ đề." }, { status: 404 });
    }

    const form = await request.formData();
    const label = String(form.get("label") ?? registry.markers[index].label).trim();
    const existing = registry.markers[index];
    const dir = markerUploadDir(id);
    const now = new Date().toISOString();

    const variants = await saveVariantFiles(form, dir, existing.variants);

    let videoSrc = existing.videoSrc;
    const videoFile = form.get("video");
    if (videoFile instanceof File && videoFile.size > 0) {
      const ext = pathExt(videoFile.name, ".mp4");
      videoSrc = publicUrlFromUpload(
        await saveUploadedFile(videoFile, `${dir}/video${ext}`)
      );
    }

    const articleBase = parseArticleFromForm(form, existing.article);
    const article = {
      ...articleBase,
      sections: await mergeSectionImages(
        form,
        articleBase.sections,
        dir,
        existing.article.sections
      ),
    };

    registry.markers[index] = {
      ...existing,
      label,
      previewImage: variants.withBackground.previewImage,
      sourceImage: variants.withBackground.sourceImage,
      videoSrc,
      variants,
      article,
      updatedAt: now,
    };
    await writeRegistry(registry);

    return NextResponse.json({
      marker: registry.markers[index],
      registry,
    });
  } catch (err) {
    console.error("[PUT /api/markers/[id]]", err);
    const message =
      err instanceof Error ? err.message : "Không thể cập nhật chủ đề.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const registry = await readRegistry();
    const before = registry.markers.length;
    registry.markers = registry.markers.filter((m) => m.id !== id);

    if (registry.markers.length === before) {
      return NextResponse.json({ error: "Không tìm thấy chủ đề." }, { status: 404 });
    }

    registry.markers = reindexMarkers(registry.markers);
    await writeRegistry(registry);

    try {
      await fs.rm(markerUploadDir(id), { recursive: true, force: true });
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, registry });
  } catch (err) {
    console.error("[DELETE /api/markers/[id]]", err);
    return NextResponse.json({ error: "Không thể xóa chủ đề." }, { status: 500 });
  }
}
