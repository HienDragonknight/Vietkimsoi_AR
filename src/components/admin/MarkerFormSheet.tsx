"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileUp,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { defaultArticle, parseArticlePaste } from "@/lib/markers/article";
import type {
  ArticleSection,
  MarkerEntry,
  MarkerRegistry,
} from "@/lib/markers/types";
import {
  VARIANT_KEYS,
  VARIANT_LABELS,
  type VariantKey,
} from "@/lib/markers/variants";
import { isYouTubeUrl } from "@/lib/video";

interface MarkerFormSheetProps {
  open: boolean;
  marker?: MarkerEntry;
  onClose: () => void;
  onSuccess: (registry?: MarkerRegistry) => void;
}

type SectionDraft = ArticleSection & {
  imageFile?: File | null;
};

export function MarkerFormSheet({
  open,
  marker,
  onClose,
  onSuccess,
}: MarkerFormSheetProps) {
  const isEdit = !!marker;
  const initialArticle = marker?.article ?? defaultArticle(marker?.label ?? "");
  const initialVideoIsUrl = marker?.videoSrc
    ? marker.videoSrc.startsWith("http://") || marker.videoSrc.startsWith("https://")
    : false;

  const [label, setLabel] = useState(marker?.label ?? "");
  const [variants, setVariants] = useState<Record<VariantKey, File | null>>({
    onShirt: null,
    noBackground: null,
    withBackground: null,
  });
  const [videoMode, setVideoMode] = useState<"file" | "url">(
    initialVideoIsUrl ? "url" : "file"
  );
  const [video, setVideo] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string>(
    initialVideoIsUrl ? marker?.videoSrc ?? "" : ""
  );
  const [pasteText, setPasteText] = useState("");
  const [articleTitle, setArticleTitle] = useState(initialArticle.articleTitle);
  const [sections, setSections] = useState<SectionDraft[]>(
    initialArticle.sections.length > 0
      ? initialArticle.sections.map((s) => ({ ...s, imageFile: null }))
      : [{ heading: "GIỚI THIỆU", body: "", imageFile: null }]
  );
  const [submitting, setSubmitting] = useState(false);

  const existingVariants = marker?.variants;

  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      return alert("Dán nội dung vào ô bên trên trước.");
    }
    const parsed = parseArticlePaste(pasteText);
    if (parsed.articleTitle) setArticleTitle(parsed.articleTitle);
    if (parsed.sections.length > 0) {
      setSections(
        parsed.sections.map((s) => ({
          ...s,
          imageFile: null,
        }))
      );
    } else {
      alert("Không tách được section. Kiểm tra tiêu đề IN HOA (VD: NGUỒN GỐC).");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return alert("Nhập tên chủ đề (VD: LÚA, SEN, VOI, RỒNG).");

    if (!isEdit) {
      const missing = VARIANT_KEYS.filter((k) => !variants[k]);
      if (missing.length > 0) {
        return alert(`Chọn đủ 3 ảnh marker: ${missing.map((k) => VARIANT_LABELS[k]).join(", ")}`);
      }
      if (videoMode === "file" && !video) {
        return alert("Chọn file video cho chủ đề này.");
      }
      if (videoMode === "url" && !videoUrlInput.trim()) {
        return alert("Nhập link video public (VD: https://youtube.com/shorts/fBNOUSssxFI).");
      }
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("label", label.trim());
      form.append("articleTitle", articleTitle || label.trim());
      form.append("videoCaption", "");
      form.append(
        "sectionsJson",
        JSON.stringify(
          sections.map(({ heading, body, image }) => ({
            heading,
            body,
            image,
          }))
        )
      );

      for (const key of VARIANT_KEYS) {
        if (variants[key]) form.append(`variant_${key}`, variants[key]!);
      }
      if (videoMode === "url" && videoUrlInput.trim()) {
        form.append("videoUrl", videoUrlInput.trim());
      } else if (video) {
        form.append("video", video);
      }

      sections.forEach((section, i) => {
        if (section.imageFile) {
          form.append(`sectionImage_${i}`, section.imageFile);
        }
      });

      const url = isEdit ? `/api/markers/${marker.id}` : "/api/markers";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Lưu thất bại.");

      onSuccess(data.registry);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lỗi lưu chủ đề.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSection = (index: number, patch: Partial<SectionDraft>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const sectionCountLabel = useMemo(
    () => `${sections.length} section`,
    [sections.length]
  );

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
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] flex-col rounded-t-3xl border border-white/10 bg-neutral-900 shadow-2xl sm:inset-x-4 sm:bottom-4 sm:mx-auto sm:max-h-[92dvh] sm:max-w-3xl sm:rounded-3xl lg:max-w-4xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-base font-semibold sm:text-lg">
                  {isEdit ? "Sửa chủ đề AR" : "Thêm chủ đề AR mới"}
                </h3>
                <p className="mt-0.5 text-xs text-white/45">
                  3 marker + 1 video + nội dung tự tách section
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
                <Field label="Tên chủ đề *">
                    <input
                      value={label}
                      onChange={(e) => {
                        const next = e.target.value;
                        setLabel(next);
                        if (
                          !articleTitle.trim() ||
                          articleTitle === marker?.label ||
                          articleTitle === label
                        ) {
                          setArticleTitle(next);
                        }
                      }}
                      className="field-input"
                      placeholder="VD: LÚA, SEN, VOI, RỒNG"
                    />
                </Field>

                <section className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white/85">
                      3 ảnh marker (cùng 1 logo)
                    </h4>
                    <p className="mt-1 text-xs text-white/45">
                      Mỗi biến thể = 1 target khi compile. Quét bất kỳ ảnh nào
                      cũng mở cùng video & bài viết.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {VARIANT_KEYS.map((key) => (
                      <VariantPick
                        key={key}
                        variantKey={key}
                        label={VARIANT_LABELS[key]}
                        file={variants[key]}
                        existingUrl={existingVariants?.[key]?.sourceImage}
                        onChange={(f) =>
                          setVariants((prev) => ({ ...prev, [key]: f }))
                        }
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-semibold text-white/85">
                      {isEdit ? "Video (1 video / chủ đề)" : "Video *"}
                    </label>
                    <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setVideoMode("file")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                          videoMode === "file"
                            ? "bg-white text-black font-semibold shadow-sm"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <FileUp size={14} />
                        Tải file
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoMode("url")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                          videoMode === "url"
                            ? "bg-white text-black font-semibold shadow-sm"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        <LinkIcon size={14} />
                        Link public / Youtube
                      </button>
                    </div>
                  </div>

                  {videoMode === "file" ? (
                    <FilePick
                      label=""
                      accept="video/*"
                      icon={<FileUp size={18} />}
                      file={video}
                      hint="Video phát sau khi quét — VD: Bản sao của Lúa.mp4"
                      existingUrl={marker?.videoSrc && !marker.videoSrc.startsWith("http") ? marker.videoSrc : undefined}
                      onChange={setVideo}
                    />
                  ) : (
                    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3.5 sm:p-4">
                      <div className="relative">
                        <input
                          type="url"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="VD: https://youtube.com/shorts/fBNOUSssxFI"
                          className="field-input pr-9 text-sm"
                        />
                        {videoUrlInput && (
                          <button
                            type="button"
                            onClick={() => setVideoUrlInput("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-white/45">
                        Hỗ trợ link Youtube Shorts, Youtube Video, hoặc link trực tiếp .mp4 / .webm public.
                      </p>
                      {isYouTubeUrl(videoUrlInput) && (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                          <Sparkles size={14} />
                          <span>Đã nhận diện link Youtube Shorts / Video! Video sẽ hiển thị dạng player Youtube trên AR.</span>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="space-y-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                        <Sparkles size={16} />
                        Dán nội dung — tự tách section
                      </h4>
                      <p className="mt-1 text-xs text-white/50">
                        Copy từ Google Docs. Dòng IN HOA (NGUỒN GỐC, Ý NGHĨA…)
                        thành tiêu đề section.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleParsePaste}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-black transition active:scale-[0.98]"
                    >
                      <Wand2 size={16} />
                      Tách section
                    </button>
                  </div>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={6}
                    className="field-input min-h-[140px] resize-y text-sm leading-relaxed"
                    placeholder={`🌾 LÚA – HẠT VÀNG...\n\nNGUỒN GỐC\nLúa nước gắn liền...\n\nÝ NGHĨA BIỂU TƯỢNG\nHạt lúa là biểu tượng...`}
                  />
                </section>

                <section className="space-y-4">
                  <Field label="Tiêu đề bài viết">
                    <input
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      className="field-input"
                      placeholder="Tiêu đề hiển thị dưới video"
                    />
                  </Field>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/70">
                      Sections ({sectionCountLabel})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSections((s) => [
                          ...s,
                          { heading: "MỤC MỚI", body: "", imageFile: null },
                        ])
                      }
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70"
                    >
                      + Thêm section
                    </button>
                  </div>

                  {sections.map((section, i) => (
                    <div
                      key={i}
                      className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                          {i + 1}
                        </span>
                        <input
                          value={section.heading}
                          onChange={(e) =>
                            updateSection(i, { heading: e.target.value })
                          }
                          className="field-input flex-1 text-sm"
                          placeholder="TIÊU ĐỀ (VD: NGUỒN GỐC)"
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
                        className="field-input min-h-[96px] resize-y text-sm leading-relaxed"
                        placeholder="Nội dung section..."
                      />

                      <SectionImagePick
                        existingUrl={section.image}
                        file={section.imageFile ?? null}
                        onChange={(f) => updateSection(i, { imageFile: f })}
                      />
                    </div>
                  ))}
                </section>
              </div>

              <div className="shrink-0 border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-black disabled:opacity-50"
                >
                  {submitting && <Loader2 size={18} className="animate-spin" />}
                  {isEdit ? "Cập nhật chủ đề" : "Tạo chủ đề"}
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

function VariantPick({
  variantKey,
  label,
  file,
  existingUrl,
  onChange,
}: {
  variantKey: VariantKey;
  label: string;
  file: File | null;
  existingUrl?: string;
  onChange: (f: File | null) => void;
}) {
  const preview = file
    ? URL.createObjectURL(file)
    : existingUrl;

  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-xs font-medium text-white/65">
        {label}
      </span>
      <div className="overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/30">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-3 text-center text-white/45">
            <ImagePlus size={22} />
            <span className="text-[11px]">Chọn ảnh</span>
          </div>
        )}
        <div className="border-t border-white/10 px-3 py-2">
          <p className="truncate text-[11px] text-white/55">
            {file ? file.name : existingUrl ? "Giữ ảnh hiện tại" : "Chưa chọn"}
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </label>
  );
}

function SectionImagePick({
  existingUrl,
  file,
  onChange,
}: {
  existingUrl?: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : existingUrl;

  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-xs text-white/50">
        Ảnh minh họa section (tùy chọn)
      </span>
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-2.5">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="h-14 w-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40">
            <ImagePlus size={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            {file ? file.name : existingUrl ? "Đổi ảnh section" : "Thêm ảnh"}
          </p>
          <p className="text-[11px] text-white/40">1 ảnh / 1 section nội dung</p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </label>
  );
}

function FilePick({
  label,
  accept,
  icon,
  file,
  hint,
  existingUrl,
  onChange,
}: {
  label: string;
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  hint: string;
  existingUrl?: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-sm text-white/70">{label}</span>
      <div className="flex min-h-[56px] items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black/25 px-4 py-3 active:bg-black/40">
        <span className="text-white/60">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            {file
              ? file.name
              : existingUrl
              ? "Giữ video hiện tại — chạm để thay"
              : "Chạm để chọn file"}
          </p>
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
