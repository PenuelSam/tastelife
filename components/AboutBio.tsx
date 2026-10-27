"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./About.module.css";

gsap.registerPlugin(useGSAP);

const DESKTOP = "(min-width: 768px)";

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
      if (wasOpen.current === open) return;
      wasOpen.current = open;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lines = more.querySelectorAll("p");
      gsap.killTweensOf([more, lines]);

      if (open) {
        const duration = reduced ? 0 : 0.8;
        pinned.current ??= pinColumns(more);
        const pin = pinned.current;
        const full = more.scrollHeight;
        gsap.fromTo(
          more,
          { height: more.offsetHeight },
          { height: full, duration, ease: "power2.inOut", onComplete: () => void gsap.set(more, { height: "auto" }) }
        );
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
        const unpin = () => {
          if (pin) gsap.set([pin.left, pin.right], { clearProps: "alignSelf,marginTop" });
          pinned.current = null;
        };
        gsap.to(lines, { opacity: 0, duration: reduced ? 0 : 0.3, ease: "power1.out" });
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
