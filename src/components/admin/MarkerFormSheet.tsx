"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { defaultArticle } from "@/lib/markers/article";
import type { ArticleSection, MarkerEntry, MarkerRegistry } from "@/lib/markers/types";

interface MarkerFormSheetProps {
  open: boolean;
  marker?: MarkerEntry;
  onClose: () => void;
  onSuccess: (registry?: MarkerRegistry) => void;
}

export function MarkerFormSheet({
  open,
  marker,
  onClose,
  onSuccess,
}: MarkerFormSheetProps) {
  const isEdit = !!marker;
  const initialArticle = marker?.article ?? defaultArticle(marker?.label ?? "");

  const [tab, setTab] = useState<"media" | "content">("media");
  const [label, setLabel] = useState(marker?.label ?? "");
  const [preview, setPreview] = useState<File | null>(null);
  const [source, setSource] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoCaption, setVideoCaption] = useState(initialArticle.videoCaption);
  const [articleTitle, setArticleTitle] = useState(initialArticle.articleTitle);
  const [sections, setSections] = useState<ArticleSection[]>(
    initialArticle.sections.length > 0
      ? initialArticle.sections
      : [{ heading: "GIỚI THIỆU", body: "" }]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return alert("Nhập tên marker.");
    if (!isEdit && (!preview || !source || !video)) {
      return alert("Chọn đủ ảnh preview, ảnh nguồn và video.");
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("label", label.trim());
      if (preview) form.append("previewImage", preview);
      if (source) form.append("sourceImage", source);
      if (video) form.append("video", video);
      form.append("videoCaption", videoCaption);
      form.append("articleTitle", articleTitle || label.trim());
      form.append("sectionsJson", JSON.stringify(sections));

      const url = isEdit ? `/api/markers/${marker.id}` : "/api/markers";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Lưu thất bại.");
      }
      const data = await res.json();
      onSuccess(data.registry);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi lưu marker.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSection = (index: number, patch: Partial<ArticleSection>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border border-white/10 bg-neutral-900 shadow-2xl sm:left-1/2 sm:max-h-[90dvh] sm:max-w-xl sm:-translate-x-1/2"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4">
              <h3 className="text-base font-semibold">
                {isEdit ? "Sửa marker" : "Thêm marker mới"}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex shrink-0 gap-1 border-b border-white/10 px-4 py-2">
              {(["media", "content"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                    tab === t
                      ? "bg-white text-black"
                      : "text-white/55 hover:bg-white/5"
                  }`}
                >
                  {t === "media" ? "Media" : "Nội dung trang"}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {tab === "media" ? (
                  <>
                    <Field label="Tên marker *">
                      <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="field-input"
                        placeholder="VD: Lúa - ảnh AR"
                      />
                    </Field>
                    <FilePick
                      label={isEdit ? "Ảnh preview" : "Ảnh preview *"}
                      accept="image/*"
                      icon={<ImagePlus size={18} />}
                      file={preview}
                      hint="Thumbnail admin"
                      onChange={setPreview}
                    />
                    <FilePick
                      label={isEdit ? "Ảnh nguồn" : "Ảnh nguồn *"}
                      accept="image/*"
                      icon={<ImagePlus size={18} />}
                      file={source}
                      hint="Ảnh in / MindAR compile"
                      onChange={setSource}
                    />
                    <FilePick
                      label={isEdit ? "Video" : "Video *"}
                      accept="video/*"
                      icon={<FileUp size={18} />}
                      file={video}
                      hint="Video phía trên trang"
                      onChange={setVideo}
                    />
                  </>
                ) : (
                  <>
                    <Field label="Caption trên video">
                      <input
                        value={videoCaption}
                        onChange={(e) => setVideoCaption(e.target.value)}
                        className="field-input"
                        placeholder="VD: from the fields that stretch..."
                      />
                    </Field>
                    <Field label="Tiêu đề bài viết">
                      <input
                        value={articleTitle}
                        onChange={(e) => setArticleTitle(e.target.value)}
                        className="field-input"
                        placeholder="VD: 🌾 LÚA – HẠT VÀNG..."
                      />
                    </Field>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white/70">
                          Các mục nội dung
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSections((s) => [
                              ...s,
                              { heading: "MỤC MỚI", body: "" },
                            ])
                          }
                          className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/70"
                        >
                          <Plus size={14} />
                          Thêm mục
                        </button>
                      </div>

                      {sections.map((section, i) => (
                        <div
                          key={i}
                          className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              value={section.heading}
                              onChange={(e) =>
                                updateSection(i, { heading: e.target.value })
                              }
                              className="field-input flex-1 text-sm"
                              placeholder="TIÊU ĐỀ MỤC (VD: NGUỒN GỐC)"
                            />
                            {sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSections((s) => s.filter((_, j) => j !== i))
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 text-rose-300"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                          <textarea
                            value={section.body}
                            onChange={(e) =>
                              updateSection(i, { body: e.target.value })
                            }
                            rows={4}
                            className="field-input min-h-[100px] resize-y text-sm leading-relaxed"
                            placeholder="Nội dung đoạn văn. Dùng dòng trống để tách đoạn."
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black disabled:opacity-50"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {isEdit ? "Cập nhật marker" : "Tạo marker"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}

function FilePick({
  label,
  accept,
  icon,
  file,
  hint,
  onChange,
}: {
  label: string;
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  hint: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-sm text-white/70">{label}</span>
      <div className="flex min-h-[56px] items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/25 px-4 py-3 active:bg-black/40">
        <span className="text-white/60">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{file ? file.name : "Chạm để chọn file"}</p>
          <p className="text-xs text-white/40">{hint}</p>
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </label>
  );
}
