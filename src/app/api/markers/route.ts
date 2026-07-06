import { NextResponse } from "next/server";
import {
  generateMarkerId,
  publicUrlFromUpload,
  readRegistry,
  reindexMarkers,
  saveUploadedFile,
  writeRegistry,
  markerUploadDir,
} from "@/lib/markers/store";
import type { MarkerEntry } from "@/lib/markers/types";
import { defaultArticle, parseArticleFromForm } from "@/lib/markers/article";

export async function GET() {
  const registry = await readRegistry();
  return NextResponse.json(registry);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const label = String(form.get("label") ?? "").trim();
    if (!label) {
      return NextResponse.json({ error: "Tên marker là bắt buộc." }, { status: 400 });
    }

    const previewFile = form.get("previewImage");
    const sourceFile = form.get("sourceImage");
    const videoFile = form.get("video");

    if (!(previewFile instanceof File) || previewFile.size === 0) {
      return NextResponse.json({ error: "Ảnh preview là bắt buộc." }, { status: 400 });
    }
    if (!(sourceFile instanceof File) || sourceFile.size === 0) {
      return NextResponse.json({ error: "Ảnh nguồn (để in/quét) là bắt buộc." }, { status: 400 });
    }
    if (!(videoFile instanceof File) || videoFile.size === 0) {
      return NextResponse.json({ error: "Video là bắt buộc." }, { status: 400 });
    }

    const registry = await readRegistry();
    const id = generateMarkerId();
    const dir = markerUploadDir(id);
    const now = new Date().toISOString();

    const previewExt = pathExt(previewFile.name, ".jpg");
    const sourceExt = pathExt(sourceFile.name, ".jpg");
    const videoExt = pathExt(videoFile.name, ".mp4");

    const previewPath = await saveUploadedFile(
      previewFile,
      `${dir}/preview${previewExt}`
    );
    const sourcePath = await saveUploadedFile(
      sourceFile,
      `${dir}/source${sourceExt}`
    );
    const videoPath = await saveUploadedFile(
      videoFile,
      `${dir}/video${videoExt}`
    );

    const entry: MarkerEntry = {
      id,
      label,
      targetIndex: registry.markers.length,
      previewImage: publicUrlFromUpload(previewPath),
      sourceImage: publicUrlFromUpload(sourcePath),
      videoSrc: publicUrlFromUpload(videoPath),
      article: parseArticleFromForm(form, defaultArticle(label)),
      createdAt: now,
      updatedAt: now,
    };

    registry.markers = reindexMarkers([...registry.markers, entry]);
    await writeRegistry(registry);

    return NextResponse.json({ marker: entry, registry }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/markers]", err);
    return NextResponse.json({ error: "Không thể tạo marker." }, { status: 500 });
  }
}

function pathExt(filename: string, fallback: string): string {
  const ext = filename.includes(".") ? `.${filename.split(".").pop()}` : fallback;
  return ext.toLowerCase();
}
