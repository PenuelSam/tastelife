"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./About.module.css";

gsap.registerPlugin(useGSAP);

const DESKTOP = "(min-width: 768px)";

/**
 * Desktop: the two columns are centred in their row, so a taller bio would push
 * ABOUT ME down and the heading up. Before opening, pin both columns where they
 * are (top-aligned with a margin), so ABOUT ME stays put and the bio column only
 * rises as far as the top of ABOUT ME, then grows downward.
 */
function pinColumns(more: HTMLElement) {
  const right = more.closest<HTMLElement>(`.${styles.right}`);
  const left = right?.previousElementSibling as HTMLElement | null;
  const grid = right?.parentElement;
  if (!right || !left || !grid || !window.matchMedia(DESKTOP).matches) return null;
  const rowTop = grid.getBoundingClientRect().top + parseFloat(getComputedStyle(grid).paddingTop);
  const leftTop = left.getBoundingClientRect().top - rowTop;
  const rightTop = right.getBoundingClientRect().top - rowTop;
  gsap.set(left, { alignSelf: "start", marginTop: leftTop });
  gsap.set(right, { alignSelf: "start", marginTop: rightTop });
  return { left, right, leftTop, rightTop };
}

/**
 * The bio, truncated to its first paragraph. "Read more" sits right after its
 * last word and smoothly opens the rest; "Read less", after the last word of
 * the bio, closes it again. Reduced motion: instant.
 */
export default function AboutBio({ paragraphs }: { paragraphs: string[] }) {
  const [first, ...rest] = paragraphs;
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const lessRef = useRef<HTMLButtonElement>(null);
  const pinned = useRef<ReturnType<typeof pinColumns>>(null);
  const wasOpen = useRef(false);
  const id = useId();

  useGSAP(
    () => {
      const more = moreRef.current;
      if (!more) return;
      // Only animate real toggles (not the first render, or StrictMode's re-run of it).
      if (wasOpen.current === open) return;
      wasOpen.current = open;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lines = more.querySelectorAll("p");
      gsap.killTweensOf([more, lines]);

      if (open) {
        const duration = reduced ? 0 : 0.8;
        // Pin once per open/close cycle; re-opening mid-close keeps the existing pin.
        pinned.current ??= pinColumns(more);
        const pin = pinned.current;
        const full = more.scrollHeight;
        gsap.fromTo(
          more,
          { height: more.offsetHeight },
          { height: full, duration, ease: "power2.inOut", onComplete: () => void gsap.set(more, { height: "auto" }) }
        );
        // Rise by half the growth (as if still centred), but never above ABOUT ME.
        if (pin) {
          gsap.killTweensOf(pin.right);
          gsap.to(pin.right, { marginTop: Math.max(pin.leftTop, pin.rightTop - full / 2), duration, ease: "power2.inOut" });
        }
        if (reduced) gsap.set(lines, { clearProps: "opacity,transform" });
        else gsap.fromTo(lines, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08, delay: 0.2 });
        lessRef.current?.focus({ preventScroll: true });
      } else {
        const duration = reduced ? 0 : 0.7;
        const pin = pinned.current;
        // Back to the stylesheet's centring, which matches the pinned closed position.
        const unpin = () => {
          if (pin) gsap.set([pin.left, pin.right], { clearProps: "alignSelf,marginTop" });
          pinned.current = null;
        };
        gsap.to(lines, { opacity: 0, duration: reduced ? 0 : 0.3, ease: "power1.out" });
        // One timeline, so the unpin runs after the last frame of both tweens.
        const tl = gsap.timeline({ onComplete: unpin });
        tl.fromTo(more, { height: more.offsetHeight }, { height: 0, duration, ease: "power2.inOut" }, 0);
        if (pin) {
          gsap.killTweensOf(pin.right);
          tl.to(pin.right, { marginTop: pin.rightTop, duration, ease: "power2.inOut" }, 0);
        }
        moreButtonRef.current?.focus({ preventScroll: true });
      }
    },
    { dependencies: [open], scope: moreRef }
  );

  if (rest.length === 0) {
    return (
      <div className={styles.bio}>
        <p>{first}</p>
      </div>
    );
  }

  const last = rest.length - 1;

  return (
    <div className={styles.bio}>
      <p>
        {first}{" "}
        {/* Stays in place (just invisible) while open, so the paragraph never reflows. */}
        <button
          ref={moreButtonRef}
          type="button"
          className={styles.readMore}
          data-hidden={open || undefined}
          aria-expanded={open}
          aria-controls={id}
          tabIndex={open ? -1 : undefined}
          onClick={() => setOpen(true)}
        >
          Read more
        </button>
      </p>
      {/* Collapsed by default; inert while closed so it isn't read or focused. */}
      <div ref={moreRef} id={id} className={styles.bioMore} inert={!open}>
        {rest.map((paragraph, i) => (
          <p key={paragraph.slice(0, 24)}>
            {paragraph}
            {i === last && (
              <>
                {" "}
                <button
                  ref={lessRef}
                  type="button"
                  className={styles.readMore}
                  aria-expanded={open}
                  aria-controls={id}
                  onClick={() => setOpen(false)}
                >
                  Read less
                </button>
              </>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
