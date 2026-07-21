/**
 * Helper utilities for working with public video URLs (e.g. YouTube shorts, YouTube watch links, MP4 URLs).
 */

export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Match shorts/ID
  const shortsMatch = trimmed.match(/(?:youtube\.com|youtube-nocookie\.com)\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch) return shortsMatch[1];

  // Match watch?v=ID or watch?.*&v=ID
  const watchMatch = trimmed.match(/(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/i);
  if (watchMatch) return watchMatch[1];

  // Match youtu.be/ID
  const shortlinkMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (shortlinkMatch) return shortlinkMatch[1];

  // Match embed/ID
  const embedMatch = trimmed.match(/(?:youtube\.com|youtube-nocookie\.com)\/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch) return embedMatch[1];

  return null;
}

export function isYouTubeUrl(url: string | null | undefined): boolean {
  return getYouTubeVideoId(url) !== null;
}

export function getYouTubeEmbedUrl(
  url: string,
  options: { autoplay?: boolean; mute?: boolean; loop?: boolean; controls?: boolean } = {}
): string {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return url;
  const { autoplay = true, mute = false, loop = true, controls = false } = options;
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: mute ? "1" : "0",
    loop: loop ? "1" : "0",
    playlist: videoId,
    playsinline: "1",
    controls: controls ? "1" : "0",
    disablekb: "1",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    fs: "0",
    cc_load_policy: "0",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
