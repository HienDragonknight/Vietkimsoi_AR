"use client";

import type { MarkerArticle } from "@/lib/markers/types";

interface ArticleContentProps {
  article: MarkerArticle;
}

/**
 * Scrollable article block below the video — cream background, maroon
 * section headings, responsive typography for mobile.
 */
export function ArticleContent({ article }: ArticleContentProps) {
  return (
    <article className="bg-[#FFF9F1] px-4 py-6 text-neutral-900 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-lg font-bold leading-snug text-[#8B1E1E] sm:text-xl md:text-2xl">
          {article.articleTitle}
        </h1>

        <div className="mt-6 space-y-8 sm:mt-8 sm:space-y-10">
          {article.sections.map((section, i) => (
            <section key={`${section.heading}-${i}`}>
              {section.image && (
                <div className="mb-4 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={section.image}
                    alt={section.heading || `Section ${i + 1}`}
                    className="w-full object-cover"
                  />
                </div>
              )}
              {section.heading && (
                <h2 className="mb-3 text-sm font-bold tracking-wide text-[#8B1E1E] sm:mb-4 sm:text-base">
                  {section.heading}
                </h2>
              )}
              {section.body && (
                <div className="space-y-3 text-[13.5px] leading-[1.75] text-neutral-800 sm:text-[15px] sm:leading-[1.8]">
                  {section.body.split(/\n\n+/).map((para, j) => (
                    <p key={j}>{para.trim()}</p>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
