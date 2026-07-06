"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, ScanLine } from "lucide-react";

interface AdminHeaderProps {
  markerCount: number;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function AdminHeader({
  markerCount,
  onRefresh,
  refreshing,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 transition active:scale-95 hover:bg-white/10"
            aria-label="Về trang quét"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              Bảng điều khiển AR
            </h1>
            <p className="truncate text-xs text-white/50 sm:text-sm">
              {markerCount} marker · Quản lý & compile targets.mind
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 sm:flex"
          >
            <ScanLine size={14} />
            Trang quét
          </Link>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition active:scale-95 hover:bg-white/10 disabled:opacity-50"
            aria-label="Làm mới"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </header>
  );
}
