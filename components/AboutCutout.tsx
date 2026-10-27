"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./About.module.css";

export default function AboutCutout({ src, alt }: { src: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <div className={styles.cutout} data-intro="cutout">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={styles.cutoutImage}
        data-loaded={loaded ? "" : undefined}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
