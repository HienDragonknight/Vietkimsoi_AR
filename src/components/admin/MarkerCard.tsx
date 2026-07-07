"use client";

import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { MarkerEntry } from "@/lib/markers/types";
import { VARIANT_KEYS, VARIANT_LABELS } from "@/lib/markers/variants";

interface MarkerCardProps {
  marker: MarkerEntry;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function MarkerCard({
  marker,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: MarkerCardProps) {
  const indices = marker.targetIndices?.length
    ? marker.targetIndices
    : [marker.targetIndex];
  const indexLabel =
    indices.length > 1
      ? `#${indices[0]}–${indices[indices.length - 1]}`
      : `#${marker.targetIndex}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
      <div className="relative aspect-[4/3] bg-black/50 sm:aspect-[5/4]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={marker.previewImage}
          alt={marker.label}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-sm sm:left-3 sm:top-3">
          {indexLabel}
        </span>
        <span className="absolute bottom-2 right-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">
          3 marker
        </span>
      </div>

      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-medium sm:text-[15px]">
            {marker.label}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-white/45">
            {marker.article.articleTitle}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {VARIANT_KEYS.map((key) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={key}
              src={marker.variants?.[key]?.sourceImage ?? marker.sourceImage}
              alt={VARIANT_LABELS[key]}
              title={VARIANT_LABELS[key]}
              className="aspect-square rounded-lg object-cover ring-1 ring-white/10"
            />
          ))}
        </div>

        <div className="flex gap-2 text-[11px] text-white/50">
          <span>{marker.article.sections.length} section</span>
          <span>·</span>
          <a
            href={marker.videoSrc}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-white hover:underline"
          >
            Video
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 transition active:scale-95 hover:bg-white/5 disabled:opacity-30"
            aria-label="Lên"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 transition active:scale-95 hover:bg-white/5 disabled:opacity-30"
            aria-label="Xuống"
          >
            <ChevronDown size={18} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 text-sm transition active:scale-95 hover:bg-white/5"
          >
            <Pencil size={15} />
            Sửa
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/25 text-rose-300 transition active:scale-95 hover:bg-rose-500/10"
            aria-label="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
