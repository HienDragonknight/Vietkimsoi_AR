import { NextResponse } from "next/server";
import { readRegistry, reindexMarkers, writeRegistry } from "@/lib/markers/store";

/** Reorder markers — updates targetIndex to match new order for MindAR compile. */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const orderedIds = body?.orderedIds as string[] | undefined;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds không hợp lệ." }, { status: 400 });
    }

    const registry = await readRegistry();
    const map = new Map(registry.markers.map((m) => [m.id, m]));
    const reordered = orderedIds
      .map((id) => map.get(id))
      .filter((m): m is NonNullable<typeof m> => !!m);

    if (reordered.length !== registry.markers.length) {
      return NextResponse.json(
        { error: "Danh sách ID không khớp số marker hiện có." },
        { status: 400 }
      );
    }

    registry.markers = reindexMarkers(reordered);
    await writeRegistry(registry);

    return NextResponse.json({ ok: true, registry });
  } catch (err) {
    console.error("[PUT /api/markers/reorder]", err);
    return NextResponse.json({ error: "Không thể sắp xếp lại." }, { status: 500 });
  }
}
