import type { LaneItem } from "@/data/lanes";
import { prefersReducedMotion } from "./gl";

/**
 * The detail view's film, always muted. The click handler calls
 * primeDetailVideo() so loading starts right away; the detail view then adopts
 * the same element.
 */
let video: HTMLVideoElement | null = null;

export function primeDetailVideo(item: LaneItem): HTMLVideoElement | null {
  if (item.kind !== "video" || !item.src) return null;
  if (!video) {
    video = document.createElement("video");
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
    video.preload = "auto";
  }
  const el = video;
  if (el.dataset.itemId !== item.id) {
    el.src = item.src;
    el.poster = item.poster ?? "";
    el.dataset.itemId = item.id;
  }
  if (!prefersReducedMotion()) el.play().catch(() => {});
  return el;
}

/** The primed element for this item, if the click already started it. */
export function takeDetailVideo(item: LaneItem): HTMLVideoElement | null {
  return video && video.dataset.itemId === item.id ? video : null;
}

export function stopDetailVideo(el: HTMLVideoElement) {
  el.remove();
  // Wait a tick: a remount of the same item (e.g. React StrictMode) re-attaches it.
  setTimeout(() => {
    if (!el.isConnected) el.pause();
  }, 0);
}
