"use client";

import { useEffect, useRef } from "react";
import type { LaneItem } from "@/data/lanes";
import { prefersReducedMotion } from "./gl";
import styles from "./LanePage.module.css";

export default function TileVideo({ item }: { item: LaneItem }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    io.observe(video);
    return () => {
      io.disconnect();
      video.pause();
    };
  }, []);

  return (
    <>
      <video
        ref={ref}
        className={styles.fill}
        src={item.clip ?? item.src}
        poster={item.poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <span className={styles.play} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </>
  );
}
