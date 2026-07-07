/** One content block under the video (heading + paragraphs + optional illustration). */
export interface ArticleSection {
  heading: string;
  body: string;
  /** Optional image shown above the section text. */
  image?: string;
}

/** Text content shown below the video on `/ar-video/[id]`. */
export interface MarkerArticle {
  /** Optional caption overlaid on the video (white text + shadow). */
  videoCaption: string;
  /** Main article title below the video. */
  articleTitle: string;
  sections: ArticleSection[];
}

/** One printable / scannable marker image variant for a heritage logo. */
export interface MarkerImageVariant {
  label: string;
  previewImage: string;
  sourceImage: string;
}

/** Three AR marker images derived from one logo concept. */
export interface MarkerVariants {
  onShirt: MarkerImageVariant;
  noBackground: MarkerImageVariant;
  withBackground: MarkerImageVariant;
}

/** Single heritage theme (LÚA, SEN, VOI, RỒNG…) managed via admin. */
export interface MarkerEntry {
  id: string;
  label: string;
  /** First MindAR target index for this theme. */
  targetIndex: number;
  /** All compile indices for the 3 logo variants → same video/article. */
  targetIndices: number[];
  previewImage: string;
  /** Primary compile source (with-background variant). */
  sourceImage: string;
  videoSrc: string;
  variants: MarkerVariants;
  article: MarkerArticle;
  createdAt: string;
  updatedAt: string;
}

export interface MarkerRegistry {
  version: number;
  targetsMind: string;
  markers: MarkerEntry[];
}

export interface PublicMarkerConfig {
  targetsMind: string;
  maxTrack: number;
  markers: Array<{
    id: string;
    label: string;
    targetIndex: number;
    targetIndices: number[];
    videoSrc: string;
    previewImage: string;
  }>;
}
