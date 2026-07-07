/** True on phones/tablets where camera APIs require a direct user tap. */
export function needsCameraUserGesture(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowViewport = window.matchMedia("(max-width: 768px)").matches;

  return mobileUa || (coarsePointer && narrowViewport);
}
