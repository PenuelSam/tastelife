"use client";

import {
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { TransitionLink, usePageTransition } from "./PageTransition";
import styles from "./WorkPicker.module.css";

const MAX_TILT_Y = 27; // deg, left/right
const MAX_TILT_X = 22; // deg, up/down

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
// Mobile resting tilt (matches the CSS default) and the phone-tilt range on top of it.
const REST_TILT_X = 14;
const REST_TILT_Y = -24;
const MAX_PHONE_TILT = 20;
// Mobile tap: spin + lift for this long, then start the page transition.
const TAP_MS = 550;

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

// 20 stacked copies, 0.7px apart (0 to -13.3px), make the line icon look solid.
const LAYERS = 20;
const LAYER_GAP = 0.7;
const FRONT = "#D9261C";
const BACK_NEAR: [number, number, number] = [176, 28, 22];
const BACK_FAR: [number, number, number] = [104, 12, 16];

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

// `lines` stack on mobile (FASHION / DESIGN) and sit inline on desktop.
const LANES = [
  { lines: ["Fashion", "design"], href: "/fashion-design", icon: "scissors" },
  { lines: ["Styling"], href: "/styling", icon: "hanger" },
  { lines: ["Modeling"], href: "/modeling", icon: "camera" },
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
  const timersRef = useRef<number[]>([]);
  const { navigate } = usePageTransition();

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

  // Mobile: tilt the icons gently with the phone, on top of the resting tilt.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof DeviceOrientationEvent === "undefined") return;
    if (window.matchMedia(REDUCED_QUERY).matches) return;
    const mobile = window.matchMedia(MOBILE_QUERY);

    let baseBeta: number | null = null;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let raf = 0;

    const apply = () => {
      raf = 0;
      if (!mobile.matches) {
        root.style.removeProperty("--tilt-x");
        root.style.removeProperty("--tilt-y");
        return;
      }
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      root.style.setProperty("--tilt-x", `${(REST_TILT_X + current.x).toFixed(2)}deg`);
      root.style.setProperty("--tilt-y", `${(REST_TILT_Y + current.y).toFixed(2)}deg`);
      if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05) {
        raf = requestAnimationFrame(apply);
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      // Treat however the phone is held at first as neutral.
      if (baseBeta === null) baseBeta = e.beta;
      target.x = clamp(-(e.beta - baseBeta), MAX_PHONE_TILT);
      target.y = clamp(e.gamma, MAX_PHONE_TILT);
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const listen = () => window.addEventListener("deviceorientation", onOrientation);

    // iOS needs permission, requested from a user gesture: the first tap anywhere.
    const permissionApi = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    let onFirstTap: (() => void) | null = null;
    if (typeof permissionApi.requestPermission === "function") {
      const request = permissionApi.requestPermission;
      onFirstTap = () => {
        request()
          .then((state) => {
            if (state === "granted") listen();
          })
          .catch(() => {});
      };
      document.addEventListener("click", onFirstTap, { once: true });
    } else {
      listen();
    }

    return () => {
      if (onFirstTap) document.removeEventListener("click", onFirstTap);
      window.removeEventListener("deviceorientation", onOrientation);
      cancelAnimationFrame(raf);
      root.style.removeProperty("--tilt-x");
      root.style.removeProperty("--tilt-y");
    };
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // Mobile tap: spin the icon and lift the square, then start the transition.
  // Desktop clicks fall through to TransitionLink.
  const onLaneClick = (href: string) => (e: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!window.matchMedia(MOBILE_QUERY).matches) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const lane = e.currentTarget;
    if (window.matchMedia(REDUCED_QUERY).matches) {
      navigate(href);
      return;
    }
    if (lane.hasAttribute("data-tapped")) return;
    lane.setAttribute("data-tapped", "");
    timersRef.current.push(
      window.setTimeout(() => navigate(href), TAP_MS),
      // Reset once the transition has covered the screen.
      window.setTimeout(() => lane.removeAttribute("data-tapped"), TAP_MS + 1600)
    );
  };

  return (
    <main ref={rootRef} className={styles.page} data-theme="paper">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <h1 className={styles.title}>Three sides of me</h1>
        </div>

        <ul className={styles.lanes}>
          {LANES.map((lane) => (
            <li key={lane.href}>
              <TransitionLink href={lane.href} className={styles.lane} onClick={onLaneClick(lane.href)}>
                <span className={styles.label}>
                  {lane.lines.map((line, i) => (
                    <Fragment key={line}>
                      {i > 0 && <br className={styles.labelBreak} />}
                      {i > 0 ? ` ${line}` : line}
                    </Fragment>
                  ))}
                </span>
                <span className={styles.square}>
                  <span className={styles.float}>
                    <span className={styles.tilt}>
                      <span className={styles.spin}>
                        <Icon3D name={lane.icon} />
                      </span>
                    </span>
                  </span>
                </span>
                <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 12h18M14 5l7 7-7 7" />
                </svg>
              </TransitionLink>
            </li>
          ))}
        </ul>

        <p className={styles.hint}>
          <span className={styles.hintDesktop}>Hover a square · click to enter</span>
          <span className={styles.hintMobile}>Tap a lane · tilt your phone</span>
        </p>
      </div>
    </main>
  );
}
