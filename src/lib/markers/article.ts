import type { ArticleSection, MarkerArticle } from "./types";

export function defaultArticle(label: string): MarkerArticle {
  return {
    videoCaption: "",
    articleTitle: label,
    sections: [
      {
        heading: "GIỚI THIỆU",
        body: "Thêm nội dung bài viết tại trang Admin.",
      },
    ],
  };
}

export function parseArticleFromForm(
  form: FormData,
  fallback: MarkerArticle
): MarkerArticle {
  const videoCaption = String(form.get("videoCaption") ?? fallback.videoCaption).trim();
  const articleTitle = String(form.get("articleTitle") ?? fallback.articleTitle).trim();

  const raw = form.get("sectionsJson");
  let sections: ArticleSection[] = fallback.sections;

  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as ArticleSection[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        sections = parsed
          .map((s) => ({
            heading: String(s.heading ?? "").trim(),
            body: String(s.body ?? "").trim(),
          }))
          .filter((s) => s.heading || s.body);
      }
    } catch {
      // keep fallback
    }
  }

  return {
    videoCaption,
    articleTitle: articleTitle || fallback.articleTitle,
    sections: sections.length > 0 ? sections : fallback.sections,
  };
}

/** Ensure legacy markers loaded from disk always have an article object. */
export function normalizeMarkerArticle(
  label: string,
  article?: Partial<MarkerArticle> | null
): MarkerArticle {
  const base = defaultArticle(label);
  if (!article) return base;

  return {
    videoCaption: article.videoCaption ?? base.videoCaption,
    articleTitle: article.articleTitle ?? base.articleTitle,
    sections:
      Array.isArray(article.sections) && article.sections.length > 0
        ? article.sections.map((s) => ({
            heading: String(s.heading ?? ""),
            body: String(s.body ?? ""),
          }))
        : base.sections,
  };
}
