"use client";

import { useEffect, useRef, type KeyboardEvent, type TouchEvent } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { BOOKING_EMAIL, compCardStats, type LaneItem } from "@/data/lanes";
import { useLenis } from "../SmoothScroll";
import DetailMedia from "./DetailMedia";
import { primeDetailVideo } from "./detailVideo";
import { prefersReducedMotion } from "./gl";
import LaneMedia from "./LaneMedia";
import styles from "./LaneDetail.module.css";

gsap.registerPlugin(Flip);

const SWIPE_PX = 50;
const MOBILE = "(max-width: 767px)";

type Props = {
  /** Lane name, for the dialog label. */
  title: string;
  /** The lane's visible items (placeholders excluded). */
  items: LaneItem[];
  index: number;
  onShow: (index: number) => void;
  /** Called once the closing animation has finished; the parent then unmounts this. */
  onClose: () => void;
};

export default function LaneDetail({ title, items, index, onShow, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closingRef = useRef<gsap.core.Timeline | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lenis = useLenis();
  const item = items[index];
  const count = items.length;

  // The URL (and so `index`) updates a frame or two after a key press; this ref
  // moves immediately, so quick repeated presses each step exactly one item.
  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Item changes come from clicks, keys or swipes, so a film can start with sound here.
  const showItem = (i: number) => {
    if (closingRef.current) return;
    indexRef.current = i;
    primeDetailVideo(items[i]);
    onShow(i);
  };
  const go = (step: number) => showItem((indexRef.current + step + count) % count);

  // Lock page scroll, pause Lenis and move focus in while open.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const smooth = lenis ? lenis.current : null;
    smooth?.stop();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = previous;
      smooth?.start();
    };
  }, [lenis]);

  // If we unmount mid-close (e.g. the browser's Back button), stop and un-hide the tile.
  useEffect(
    () => () => {
      closingRef.current?.kill();
      document.querySelectorAll<HTMLElement>("[data-tile-media]").forEach((el) => (el.style.visibility = ""));
    },
    []
  );

  /**
   * Close back to where the viewer was: the media flies (GSAP Flip) into its
   * tile in the gallery while the overlay fades and its chrome slides away.
   * The gallery never moved, so the scroll position is untouched. If the tile
   * is off-screen (after Prev/Next), the media just sinks and fades instead.
   */
  const requestClose = () => {
    if (closingRef.current) return;
    const overlay = dialogRef.current;
    if (!overlay) return onClose();

    const tl = gsap.timeline({ onComplete: () => onClose() });
    closingRef.current = tl;

    if (prefersReducedMotion()) {
      tl.to(overlay, { opacity: 0, duration: 0.3, ease: "power1.out" });
      return;
    }

    // Settle the entry animation first: stop the curl, drop any liquid-reveal canvas.
    const frame = overlay.querySelector<HTMLElement>("[data-detail-frame]");
    if (frame) {
      gsap.killTweensOf(frame);
      gsap.set(frame, { clearProps: "transform,filter,opacity" });
      frame.querySelectorAll("canvas").forEach((c) => c.remove());
    }
    const media = overlay.querySelector<HTMLElement>("[data-detail-media]");
    if (media) media.style.opacity = "";

    const tileMedia = document.querySelector<HTMLElement>(`[data-item-id="${item.id}"] [data-tile-media]`);
    const r = tileMedia?.getBoundingClientRect();
    const tileOnScreen = Boolean(r && r.width && r.bottom > 0 && r.top < window.innerHeight);

    const mobile = window.matchMedia(MOBILE).matches;
    const chrome = [panelRef.current, filmRef.current].filter(Boolean);
    tl.to(overlay, { backgroundColor: "rgba(247, 239, 230, 0)", duration: 0.45, ease: "power2.out" }, 0);
    tl.to(chrome, { [mobile ? "y" : "x"]: 60, opacity: 0, duration: 0.45, ease: "power2.in" }, 0);

    if (media && tileMedia && tileOnScreen) {
      gsap.set(media, { zIndex: 3, objectFit: "cover" });
      tl.add(Flip.fit(media, tileMedia, { absolute: true, scale: false, duration: 0.7, ease: "power3.inOut" }) as gsap.core.Tween, 0);
      // Hide the tile's own media until the flying copy lands on it. (After
      // Flip.fit, which restores the target's inline styles once measured.)
      tileMedia.style.visibility = "hidden";
      tl.eventCallback("onComplete", () => {
        tileMedia.style.visibility = "";
        onClose();
      });
    } else if (media) {
      tl.to(media, { scale: 0.9, y: 40, opacity: 0, duration: 0.7, ease: "power3.inOut" }, 0);
    }
  };

  // Keep the current thumbnail in view.
  useEffect(() => {
    filmRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (closingRef.current) {
      if (e.key !== "Tab") e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      requestClose();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "Tab" && dialogRef.current) {
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button, a[href]")].filter(
        (el) => el.offsetParent !== null
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={dialogRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: ${item.title}`}
      onKeyDown={onKeyDown}
      data-lenis-prevent
    >
      <div ref={filmRef} className={styles.film} aria-label="All items">
        {items.map((thumb, i) => (
          <button
            key={thumb.id}
            type="button"
            className={styles.thumb}
            aria-current={i === index}
            aria-label={`Show ${thumb.title}`}
            onClick={() => showItem(i)}
          >
            <LaneMedia item={thumb} variant="thumb" />
          </button>
        ))}
      </div>

      <div className={styles.stage} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <DetailMedia key={item.id} item={item} />
      </div>


      <aside ref={panelRef} className={styles.panel}>
        <p className={styles.num}>{`[${item.num}]`}</p>
        <p className={styles.date}>{item.date}</p>
        <p className={styles.credit}>{item.credit}</p>

        {item.kind === "card" ? (
          <>
            <dl className={styles.stats}>
              {compCardStats.map((label) => (
                <div key={label} className={styles.stat}>
                  <dt>{label}</dt>
                  <dd>[ ]</dd>
                </div>
              ))}
            </dl>
            <a className={styles.book} href={`mailto:${BOOKING_EMAIL}`}>
              Book her
            </a>
          </>
        ) : (
          <p className={styles.description}>{item.description}</p>
        )}

        <div className={styles.bottom}>
          <h2 className={styles.name}>
            <span className={styles.nameScript}>{item.nameScript}</span>{" "}
            <span className={styles.nameCaps}>{item.nameCaps}</span>
          </h2>
          <div className={styles.navRow}>
            <button type="button" className={styles.navPill} onClick={() => go(-1)}>
              ← Prev
            </button>
            <button type="button" className={styles.navPill} onClick={() => go(1)}>
              Next →
            </button>
            <span className={styles.counter} aria-live="polite">
              {index + 1} / {count}
            </span>
          </div>
        </div>

        {/* Top-right of the panel, on the [num] row (desktop and mobile). */}
        <button ref={closeRef} type="button" className={styles.close} onClick={requestClose} aria-label="Close">
          <svg viewBox="0 0 14 14" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </aside>
    </div>
  );
}
