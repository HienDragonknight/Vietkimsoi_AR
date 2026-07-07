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

/** Strip Google Docs underline placeholders from pasted body text. */
export function stripSectionDecorators(body: string): string {
  return body
    .replace(/^_{2,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Long / decorative first line → article title, not a section heading. */
function isArticleTitleLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length > 42) return true;
  if (/[\u{1F300}-\u{1FAFF}]/u.test(trimmed)) return true;
  if (
    (trimmed.includes("–") || trimmed.includes("-") || trimmed.includes("—")) &&
    trimmed.length > 18
  ) {
    return true;
  }
  return false;
}

/** Detect section headings like "NGUỒN GỐC", "Ý NGHĨA BIỂU TƯỢNG". */
function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (isArticleTitleLine(trimmed)) return false;
  if (trimmed.length < 2 || trimmed.length > 48) return false;
  if (/[.!?…]$/.test(trimmed)) return false;

  const letters = trimmed.replace(/[^a-zA-ZÀ-ỹĂÂĐÊÔƠƯăâđêôơư]/g, "");
  if (letters.length < 2) return false;

  const upperCount = letters.match(/[A-ZÀ-ỸĂÂĐÊÔƠƯ]/g)?.length ?? 0;
  return upperCount / letters.length >= 0.65;
}

function finalizeParsedArticle(
  articleTitle: string,
  sections: ArticleSection[]
): { articleTitle: string; sections: ArticleSection[] } {
  let title = articleTitle.trim();
  const cleaned: ArticleSection[] = [];

  for (const section of sections) {
    const heading = section.heading.trim();
    const body = stripSectionDecorators(section.body);

    if (!body) {
      if (!title && heading && isArticleTitleLine(heading)) {
        title = heading;
        continue;
      }
      if (title && heading === title) continue;
      if (!heading) continue;
    }

    cleaned.push({
      heading,
      body,
      image: section.image,
    });
  }

  return { articleTitle: title, sections: cleaned };
}

/**
 * Parse pasted Google Docs / Word text into title + sections.
 * Title line (emoji / dài) → articleTitle; dòng IN HOA ngắn → section.
 */
export function parseArticlePaste(raw: string): {
  articleTitle: string;
  sections: ArticleSection[];
} {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return { articleTitle: "", sections: [] };

  const lines = text.split("\n");
  let articleTitle = "";
  const sections: ArticleSection[] = [];
  let current: ArticleSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isSectionHeading(trimmed)) {
      if (current && (current.heading || current.body.trim())) {
        sections.push({
          heading: current.heading,
          body: stripSectionDecorators(current.body),
          image: current.image,
        });
      }
      current = { heading: trimmed, body: "" };
      continue;
    }

    if (isArticleTitleLine(trimmed) && !current) {
      if (!articleTitle) {
        articleTitle = trimmed;
        continue;
      }
    }

    if (!articleTitle && !current) {
      articleTitle = trimmed;
      continue;
    }

    if (!current) {
      current = { heading: "GIỚI THIỆU", body: trimmed };
      continue;
    }

    current.body = current.body
      ? `${current.body}\n\n${trimmed}`
      : trimmed;
  }

  if (current && (current.heading || current.body.trim())) {
    sections.push({
      heading: current.heading,
      body: stripSectionDecorators(current.body),
      image: current.image,
    });
  }

  return finalizeParsedArticle(articleTitle, sections);
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
            image: s.image ? String(s.image) : undefined,
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

  let articleTitle = (article.articleTitle ?? base.articleTitle).trim() || label;
  let sections =
    Array.isArray(article.sections) && article.sections.length > 0
      ? article.sections.map((s) => ({
          heading: String(s.heading ?? "").trim(),
          body: stripSectionDecorators(String(s.body ?? "")),
          image: s.image ? String(s.image) : undefined,
        }))
      : base.sections;

  const normalized = finalizeParsedArticle(articleTitle, sections);
  articleTitle = normalized.articleTitle || label;
  sections =
    normalized.sections.length > 0 ? normalized.sections : base.sections;

  return {
    videoCaption: article.videoCaption ?? base.videoCaption,
    articleTitle,
    sections,
  };
}
