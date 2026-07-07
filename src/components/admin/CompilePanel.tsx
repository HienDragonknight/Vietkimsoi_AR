"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileUp,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { compileMarkersToMind, normalizeCompilerProgress } from "@/lib/mindar/compiler-client";
import type { MarkerEntry } from "@/lib/markers/types";
import { getVariantCompileSources } from "@/lib/markers/variants";

interface CompilePanelProps {
  markers: MarkerEntry[];
  targetsMind?: string;
  onCompiled: () => void;
}

export function CompilePanel({
  markers,
  targetsMind,
  onCompiled,
}: CompilePanelProps) {
  const [progress, setProgress] = useState(0);
  const [compiling, setCompiling] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compileSources = getVariantCompileSources(markers);

  const uploadMindFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("targetsMind", file);
      const res = await fetch("/api/markers/targets-mind", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Upload thất bại.");
      setStatus("Đã lưu targets.mind thành công!");
      onCompiled();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleAutoCompile = async () => {
    if (compileSources.length === 0) {
      setError("Thêm ít nhất 1 chủ đề (3 ảnh marker) trước khi compile.");
      return;
    }

    setCompiling(true);
    setProgress(0);
    setError(null);
    setStatus("Đang tải MindAR Compiler...");

    try {
      const imageUrls = compileSources.map((s) => s.sourceImage);
      setStatus(
        `Đang compile ${imageUrls.length} ảnh marker (3 biến thể × ${markers.length} chủ đề)...`
      );

      const buffer = await compileMarkersToMind(imageUrls, (p) => {
        setProgress(normalizeCompilerProgress(p));
      });

      setStatus("Đang lưu targets.mind...");
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const file = new File([blob], "targets.mind", {
        type: "application/octet-stream",
      });
      await uploadMindFile(file);
      setProgress(100);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Compile thất bại. Thử upload file .mind thủ công."
      );
    } finally {
      setCompiling(false);
    }
  };

  const busy = compiling || uploading;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <Sparkles size={18} className="text-amber-300" />
            MindAR Compiler
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/55 sm:text-sm">
            Compile <strong>targets.mind</strong> từ{" "}
            <strong>3 ảnh marker / chủ đề</strong> (áo → không nền → có nền).
            Cùng chủ đề quét ảnh nào cũng mở cùng video.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
          <button
            type="button"
            onClick={handleAutoCompile}
            disabled={busy || compileSources.length === 0}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-semibold text-black transition active:scale-[0.98] disabled:opacity-50"
          >
            {compiling ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {compiling ? `Compile ${progress}%` : "Compile tự động"}
          </button>

          <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-medium transition active:scale-[0.98] hover:bg-white/10">
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            Upload .mind thủ công
            <input
              type="file"
              accept=".mind"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMindFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {(compiling || progress > 0) && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {compileSources.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {compileSources.map((s) => (
            <span
              key={`${s.markerId}-${s.variantKey}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/70"
            >
              <span className="font-mono text-emerald-400">#{s.targetIndex}</span>
              {s.markerLabel}
              <span className="text-white/35">·</span>
              <span className="text-white/45">{s.variantLabel}</span>
            </span>
          ))}
        </div>
      )}

      {targetsMind && (
        <p className="mt-3 flex items-center gap-2 text-xs text-white/45">
          <FileUp size={14} />
          File hiện tại:{" "}
          <a
            href={targetsMind}
            className="truncate text-emerald-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            {targetsMind}
          </a>
        </p>
      )}

      {status && !error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 size={16} />
          {status}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
    </section>
  );
}
