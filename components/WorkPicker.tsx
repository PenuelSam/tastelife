"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { TransitionLink } from "./PageTransition";
import styles from "./WorkPicker.module.css";

const MAX_TILT_Y = 27; // deg, left/right
const MAX_TILT_X = 22; // deg, up/down

// 20 stacked copies, 0.7px apart (0 to -13.3px), make the line icon look solid.
const LAYERS = 20;
const LAYER_GAP = 0.7;
const FRONT = "#F7F0E4";
const BACK_NEAR: [number, number, number] = [222, 208, 186];
const BACK_FAR: [number, number, number] = [196, 180, 156];

function layerColor(i: number): string {
  if (i === 0) return FRONT;
  const t = (i - 1) / (LAYERS - 2);
  const [r, g, b] = BACK_NEAR.map((c, k) => Math.round(c + (BACK_FAR[k] - c) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

const ICONS: Record<string, ReactNode> = {
  scissors: (
    <>
      <circle cx="18" cy="46" r="8" />
      <circle cx="46" cy="46" r="8" />
      <path d="M23 40L44 10M41 40L20 10" />
    </>
  ),
  hanger: <path d="M26 12a6 6 0 1 1 6 6v4M32 22L6 46h52z" />,
  camera: (
    <>
      <path d="M6 18h52v36H6zM22 18l4-7h12l4 7" />
      <circle cx="32" cy="36" r="10" />
    </>
  ),
};

const LANES = [
  { label: "Fashion design", href: "/fashion-design", icon: "scissors" },
  { label: "Styling", href: "/styling", icon: "hanger" },
  { label: "Modeling", href: "/modeling", icon: "camera" },
];

function Icon3D({ name }: { name: string }) {
  return (
    <span className={styles.icon} aria-hidden="true">
      {Array.from({ length: LAYERS }, (_, i) => (
        <svg
          key={i}
          className={styles.layer}
          viewBox="0 0 64 64"
          style={{ stroke: layerColor(i), transform: `translateZ(${-i * LAYER_GAP}px)` } as CSSProperties}
        >
          {ICONS[name]}
        </svg>
      ))}
    </span>
  );
}

export default function WorkPicker() {
  const rootRef = useRef<HTMLElement>(null);

  // Tilt every icon toward the cursor via CSS variables (no React state).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (reduced || touch) return;

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      root.style.setProperty("--tilt-y", `${(nx * MAX_TILT_Y).toFixed(2)}deg`);
      root.style.setProperty("--tilt-x", `${(-ny * MAX_TILT_X).toFixed(2)}deg`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <main ref={rootRef} className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.heading}>
          <p className={styles.stepRow}>
            <span>Step 01</span>
            <span className={styles.bar} aria-hidden="true" />
            <span>Pick a lane</span>
          </p>
          <h1 className={styles.title}>Three sides of me</h1>
        </div>

        <ul className={styles.lanes}>
          {LANES.map((lane) => (
            <li key={lane.href}>
              <TransitionLink href={lane.href} className={styles.lane}>
                <span className={styles.label}>{lane.label}</span>
                <span className={styles.square}>
                  <span className={styles.float}>
                    <span className={styles.tilt}>
                      <span className={styles.spin}>
                        <Icon3D name={lane.icon} />
                      </span>
                    </span>
                  </span>
                </span>
              </TransitionLink>
            </li>
          ))}
        </ul>

        <p className={styles.hint}>Hover a square · click to enter</p>
      </div>
    </main>
  );
}
