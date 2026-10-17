"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./About.module.css";

/**
 * Transparent cutout photo. A soft silhouette shows until the image has loaded,
 * and stays when there's no image (src null) or it fails to load.
 */
export default function AboutCutout({ src, alt }: { src: string | null; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");

  // The image may finish (or fail) before hydration, when onLoad/onError aren't attached yet.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  return (
    <div className={styles.cutout}>
      {status !== "loaded" && (
        <div className={styles.cutoutPlaceholder}>
          {/* Head touches the top edge, so it overlaps the letters like the real cutout will. */}
          <svg viewBox="0 0 300 354" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
            <circle cx="150" cy="72" r="72" />
            <path d="M24 354c0-112 54-178 126-178s126 66 126 178z" />
          </svg>
          <span className={styles.cutoutLabel}>[about-cutout.png]</span>
        </div>
      )}
      {status !== "error" && (
        // Plain <img> so its load/error state can be read directly (see the effect above).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src ?? undefined}
          alt={alt}
          className={styles.cutoutImage}
          data-loaded={status === "loaded" ? "" : undefined}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
}
