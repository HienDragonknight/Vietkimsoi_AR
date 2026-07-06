import { NextResponse } from "next/server";
import path from "path";
import {
  publicUrlFromUpload,
  readRegistry,
  saveUploadedFile,
  writeRegistry,
  ensureStorageDirs,
} from "@/lib/markers/store";

/** Upload the combined `targets.mind` (all marker images compiled together). */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const mindFile = form.get("targetsMind");

    if (!(mindFile instanceof File) || mindFile.size === 0) {
      return NextResponse.json(
        { error: "File targets.mind là bắt buộc." },
        { status: 400 }
      );
    }

    await ensureStorageDirs();
    const dest = path.join(process.cwd(), "public", "uploads", "targets.mind");
    await saveUploadedFile(mindFile, dest);

    const registry = await readRegistry();
    registry.targetsMind = publicUrlFromUpload(dest);
    await writeRegistry(registry);

    return NextResponse.json({
      ok: true,
      targetsMind: registry.targetsMind,
      markerCount: registry.markers.length,
    });
  } catch (err) {
    console.error("[POST /api/markers/targets-mind]", err);
    return NextResponse.json(
      { error: "Không thể upload targets.mind." },
      { status: 500 }
    );
  }
}
