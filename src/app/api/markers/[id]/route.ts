import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  markerUploadDir,
  publicUrlFromUpload,
  readRegistry,
  reindexMarkers,
  saveUploadedFile,
  writeRegistry,
} from "@/lib/markers/store";
import { parseArticleFromForm } from "@/lib/markers/article";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const registry = await readRegistry();
  const marker = registry.markers.find((m) => m.id === id);
  if (!marker) {
    return NextResponse.json({ error: "Không tìm thấy marker." }, { status: 404 });
  }
  return NextResponse.json(marker);
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const registry = await readRegistry();
    const index = registry.markers.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Không tìm thấy marker." }, { status: 404 });
    }

    const form = await request.formData();
    const label = String(form.get("label") ?? registry.markers[index].label).trim();
    const existing = registry.markers[index];
    const dir = markerUploadDir(id);
    const now = new Date().toISOString();

    let previewImage = existing.previewImage;
    let sourceImage = existing.sourceImage;
    let videoSrc = existing.videoSrc;

    const previewFile = form.get("previewImage");
    const sourceFile = form.get("sourceImage");
    const videoFile = form.get("video");

    if (previewFile instanceof File && previewFile.size > 0) {
      const ext = `.${previewFile.name.split(".").pop() ?? "jpg"}`;
      previewImage = publicUrlFromUpload(
        await saveUploadedFile(previewFile, `${dir}/preview${ext}`)
      );
    }
    if (sourceFile instanceof File && sourceFile.size > 0) {
      const ext = `.${sourceFile.name.split(".").pop() ?? "jpg"}`;
      sourceImage = publicUrlFromUpload(
        await saveUploadedFile(sourceFile, `${dir}/source${ext}`)
      );
    }
    if (videoFile instanceof File && videoFile.size > 0) {
      const ext = `.${videoFile.name.split(".").pop() ?? "mp4"}`;
      videoSrc = publicUrlFromUpload(
        await saveUploadedFile(videoFile, `${dir}/video${ext}`)
      );
    }

    registry.markers[index] = {
      ...existing,
      label,
      previewImage,
      sourceImage,
      videoSrc,
      article: parseArticleFromForm(form, existing.article),
      updatedAt: now,
    };
    await writeRegistry(registry);

    return NextResponse.json({ marker: registry.markers[index] });
  } catch (err) {
    console.error("[PUT /api/markers/[id]]", err);
    return NextResponse.json({ error: "Không thể cập nhật marker." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const registry = await readRegistry();
    const before = registry.markers.length;
    registry.markers = registry.markers.filter((m) => m.id !== id);

    if (registry.markers.length === before) {
      return NextResponse.json({ error: "Không tìm thấy marker." }, { status: 404 });
    }

    registry.markers = reindexMarkers(registry.markers);
    await writeRegistry(registry);

    // Best-effort cleanup of uploaded files.
    try {
      await fs.rm(markerUploadDir(id), { recursive: true, force: true });
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, registry });
  } catch (err) {
    console.error("[DELETE /api/markers/[id]]", err);
    return NextResponse.json({ error: "Không thể xóa marker." }, { status: 500 });
  }
}
