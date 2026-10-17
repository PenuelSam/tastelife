"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import styles from "./About.module.css";

gsap.registerPlugin(useGSAP);

/**
 * The bio, truncated to its first paragraph. "Read more" smoothly opens the
 * rest; "Read less" closes it again. Reduced motion: instant.
 */
export default function AboutBio({ paragraphs }: { paragraphs: string[] }) {
  const [first, ...rest] = paragraphs;
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  const id = useId();

  useGSAP(
    () => {
      const more = moreRef.current;
      if (!more) return;
      // The first render matches the server (collapsed); only animate real toggles.
      if (firstRun.current) {
        firstRun.current = false;
        return;
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lines = more.querySelectorAll("p");
      if (open) {
        gsap.fromTo(more, { height: 0 }, { height: "auto", duration: reduced ? 0 : 0.7, ease: "power3.inOut" });
        if (!reduced) {
          gsap.fromTo(lines, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, delay: 0.15 });
        }
      } else {
        gsap.killTweensOf(lines);
        gsap.set(lines, { clearProps: "opacity,transform" });
        gsap.fromTo(more, { height: more.offsetHeight }, { height: 0, duration: reduced ? 0 : 0.55, ease: "power3.inOut" });
      }
    },
    { dependencies: [open], scope: moreRef }
  );

  return (
    <div className={styles.bio}>
      <p>{first}</p>
      {rest.length > 0 && (
        <>
          {/* Collapsed by default; inert while closed so it isn't read or focused. */}
          <div ref={moreRef} id={id} className={styles.bioMore} inert={!open}>
            {rest.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
          <button
            type="button"
            className={styles.readMore}
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Read less" : "Read more"}
            <svg className={styles.readMoreIcon} data-open={open || undefined} viewBox="0 0 14 9" aria-hidden="true">
              <path d="M1 1.5l6 6 6-6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
