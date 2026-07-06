/** One content block under the video (heading + paragraphs). */
export interface ArticleSection {
  heading: string;
  body: string;
}

/** Text content shown below the video on `/ar-video/[id]`. */
export interface MarkerArticle {
  /** Optional caption overlaid on the video (white text + shadow). */
  videoCaption: string;
  /** Main article title below the video. */
  articleTitle: string;
  sections: ArticleSection[];
}

/** Single AR marker entry managed via the admin panel. */
export interface MarkerEntry {
  id: string;
  label: string;
  targetIndex: number;
  previewImage: string;
  sourceImage: string;
  videoSrc: string;
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
    videoSrc: string;
    previewImage: string;
  }>;
}
