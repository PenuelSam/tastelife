"use client";

import { useEffect, useRef, useState } from "react";

const SIZE = 200;

export default function FitText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [viewBox, setViewBox] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const font = `400 ${SIZE}px ${getComputedStyle(el).fontFamily}`;
    document.fonts
      .load(font, text)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return;
        ctx.font = font;
        const m = ctx.measureText(text);
        const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        setViewBox(`${-m.actualBoundingBoxLeft} ${-m.actualBoundingBoxAscent} ${width} ${height}`);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {viewBox && (
        <svg viewBox={viewBox} focusable="false" style={{ display: "block", width: "100%", height: "auto", fill: "currentColor" }}>
          <text x={0} y={0} fontSize={SIZE} style={{ fontFamily: "inherit", letterSpacing: 0 }}>
            {text}
          </text>
        </svg>
      )}
    </span>
  );
}
