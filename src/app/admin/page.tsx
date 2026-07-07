"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { CompilePanel } from "@/components/admin/CompilePanel";
import { MarkerCard } from "@/components/admin/MarkerCard";
import { MarkerFormSheet } from "@/components/admin/MarkerFormSheet";
import type { MarkerEntry, MarkerRegistry } from "@/lib/markers/types";

export default function AdminPage() {
  const [registry, setRegistry] = useState<MarkerRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMarker, setEditingMarker] = useState<MarkerEntry | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/markers");
      if (!res.ok) throw new Error("Không tải được danh sách marker.");
      setRegistry(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...(registry?.markers ?? [])].sort(
    (a, b) => a.targetIndex - b.targetIndex
  );

  const handleDelete = async (id: string, label: string) => {
    if (
      !confirm(
        `Xóa "${label}"?\n\nSau khi xóa, bấm "Compile tự động" để tạo lại targets.mind.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/markers/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Không thể xóa marker.");
    const data = await res.json();
    setRegistry(data.registry);
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = sorted.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const next = [...sorted];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];

    const res = await fetch("/api/markers/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: next.map((m) => m.id) }),
    });
    if (!res.ok) return alert("Không thể sắp xếp lại.");
    const data = await res.json();
    setRegistry(data.registry);
  };

  const openCreate = () => {
    setEditingMarker(undefined);
    setFormOpen(true);
  };

  const openEdit = (marker: MarkerEntry) => {
    setEditingMarker(marker);
    setFormOpen(true);
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-white">
      <AdminHeader
        markerCount={registry?.markers.length ?? 0}
        onRefresh={load}
        refreshing={loading}
      />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 pb-28 sm:space-y-8 sm:px-6 sm:py-8 sm:pb-8">
        <CompilePanel
          markers={sorted}
          targetsMind={registry?.targetsMind}
          onCompiled={load}
        />

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold sm:text-base">
                Danh sách chủ đề AR
              </h2>
              <p className="mt-0.5 text-xs text-white/45">
                Mỗi chủ đề = 3 marker + 1 video + bài viết · ↑↓ = thứ tự compile
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="hidden h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition active:scale-95 sm:flex"
            >
              <Plus size={16} />
              Thêm chủ đề
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-20 text-white/50">
              <Loader2 size={22} className="animate-spin" />
              Đang tải...
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {!loading && sorted.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
              <p className="text-sm text-white/50">Chưa có marker nào.</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black"
              >
                <Plus size={16} />
                Thêm chủ đề đầu tiên
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((marker, i) => (
              <MarkerCard
                key={marker.id}
                marker={marker}
                isFirst={i === 0}
                isLast={i === sorted.length - 1}
                onEdit={() => openEdit(marker)}
                onDelete={() => handleDelete(marker.id, marker.label)}
                onMoveUp={() => handleReorder(marker.id, "up")}
                onMoveDown={() => handleReorder(marker.id, "down")}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-black/40 transition active:scale-95 sm:hidden"
        aria-label="Thêm marker"
      >
        <Plus size={24} />
      </button>

      <MarkerFormSheet
        key={editingMarker?.id ?? "new"}
        open={formOpen}
        marker={editingMarker}
        onClose={() => setFormOpen(false)}
        onSuccess={(reg) => {
          if (reg) setRegistry(reg);
          else load();
        }}
      />
    </div>
  );
}
