"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Mesh, Program, Renderer, Texture, Triangle } from "ogl";
import type { LaneItem } from "@/data/lanes";
import { primeDetailVideo, stopDetailVideo, takeDetailVideo } from "./detailVideo";
import { fullscreenVertex, hasWebGL, prefersReducedMotion } from "./gl";
import { CompCard } from "./LaneMedia";
import { ratio } from "./layout";
import styles from "./LaneDetail.module.css";

gsap.registerPlugin(useGSAP);

type Reveal = { progress: { value: number }; render: () => void; finish: () => void; destroy: () => void };

/**
 * Liquid reveal over a loaded <img>: a canvas the same size as the image runs
 * the homepage photo reveal (without the duotone), then hands back to the img.
 * Each reveal gets a fresh canvas: a canvas whose context was lost (by an
 * earlier reveal's cleanup) can never get a working context again.
 */
function createReveal(frame: HTMLElement, img: HTMLImageElement): Reveal | null {
  const w = img.offsetWidth;
  const h = img.offsetHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.className = styles.revealCanvas;
  canvas.setAttribute("aria-hidden", "true");
  frame.appendChild(canvas);
  // Layout offsets, unaffected by the frame's curl transform.
  canvas.style.left = `${img.offsetLeft}px`;
  canvas.style.top = `${img.offsetTop}px`;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: true, premultipliedAlpha: true });
  const gl = renderer.gl;
  if (!gl || gl.isContextLost()) {
    canvas.remove();
    return null;
  }
  gl.clearColor(0, 0, 0, 0);
  renderer.setSize(w, h);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const progress = { value: 0 };
  const uniforms = {
    tMap: { value: new Texture(gl, { image: img, generateMipmaps: false }) },
    uProgress: { value: 0 },
    uTime: { value: 0 },
  };
  const mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex: fullscreenVertex, fragment: revealFragment, uniforms, transparent: true }),
  });

  img.style.opacity = "0";
  canvas.style.display = "block";
  const render = () => {
    uniforms.uProgress.value = progress.value;
    uniforms.uTime.value = performance.now() / 1000;
    renderer.render({ scene: mesh });
  };
  render();

  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
  return {
    progress,
    render: () => {
      if (!destroyed) render();
    },
    finish: () => {
      img.style.opacity = "";
      destroy();
    },
    destroy: () => {
      img.style.opacity = "";
      destroy();
    },
  };
}

/** Film in the detail view: muted, tap to play or pause. */
function DetailVideo({ item }: { item: LaneItem }) {
  const hostRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    // Adopt the element the click started; on a direct link, start it now.
    const video = takeDetailVideo(item) ?? primeDetailVideo(item);
    if (!host || !video) return;
    videoRef.current = video;
    video.className = styles.media;
    video.setAttribute("data-detail-media", "");
    video.setAttribute("aria-hidden", "true");
    host.prepend(video);
    const sync = () => host.toggleAttribute("data-paused", video.paused);
    sync();
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      stopDetailVideo(video);
    };
  }, [item]);

  const onTap = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <button ref={hostRef} type="button" className={styles.videoHost} onClick={onTap} aria-label={`${item.alt}. Play or pause`}>
      <span className={styles.play} aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </button>
  );
}

/**
 * Centre media for the detail view. Every time it mounts (open, Prev/Next,
 * filmstrip) one timeline runs the page-curl on the frame and, for photos,
 * the liquid reveal, starting together.
 */
export default function DetailMedia({ item }: { item: LaneItem }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const isImage = item.kind === "image" && Boolean(item.src);

  useGSAP(
    () => {
      const frame = frameRef.current;
      if (!frame) return;

      if (prefersReducedMotion()) {
        gsap.fromTo(frame, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" });
        return;
      }

      gsap.set(frame, { opacity: 0 });
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(
        frame,
        { transformPerspective: 1400, rotationY: -34, rotationZ: 3, scale: 0.62, filter: "blur(6px)", opacity: 0 },
        { rotationY: 0, rotationZ: 0, scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.9, ease: "power3.out", clearProps: "transform,filter" },
        0
      );

      let reveal: Reveal | null = null;
      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        tl.play(0);
      };

      const img = imgRef.current;
      let timer = 0;
      const begin = () => {
        if (started || !img) return start();
        window.clearTimeout(timer);
        reveal = hasWebGL() ? createReveal(frame, img) : null;
        if (reveal) {
          const r = reveal;
          tl.to(r.progress, { value: 1, duration: 1.4, ease: "power2.out", onUpdate: r.render, onComplete: r.finish }, 0);
        }
        start();
      };

      if (isImage && img) {
        if (img.complete && img.naturalWidth) begin();
        else {
          img.addEventListener("load", begin, { once: true });
          img.addEventListener("error", start, { once: true });
          // Don't hold the curl back on a slow image; it then appears without the liquid.
          timer = window.setTimeout(start, 700);
        }
      } else {
        start();
      }

      return () => {
        window.clearTimeout(timer);
        img?.removeEventListener("load", begin);
        img?.removeEventListener("error", start);
        reveal?.destroy();
      };
    },
    { scope: frameRef, dependencies: [item.id] }
  );

  const boxVars = { "--ar": item.aspect, "--r": ratio(item.aspect) } as CSSProperties;

  let media;
  if (item.kind === "card") {
    media = (
      <span className={styles.box} style={boxVars} data-detail-media>
        <CompCard large />
      </span>
    );
  } else if (!item.src) {
    media = (
      <span className={`${styles.box} ${styles.placeholder}`} style={boxVars} data-detail-media>
        <span className={styles.placeholderLabel}>{item.title}</span>
      </span>
    );
  } else if (item.kind === "video") {
    media = <DetailVideo item={item} />;
  } else {
    // width/height are only an initial box; CSS sizes it to the photo's own proportions.
    media = (
      <>
        <Image
          ref={imgRef}
          className={styles.media}
          data-detail-media
          src={item.src}
          alt={item.alt}
          width={2000}
          height={2000}
          sizes="(max-width: 767px) 100vw, 60vw"
          loading="eager"
          fetchPriority="high"
        />
      </>
    );
  }

  return (
    <div ref={frameRef} className={styles.curl} data-detail-frame>
      {media}
    </div>
  );
}

const revealFragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform float uProgress;
  uniform float uTime;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float t = uTime;
    float p = uProgress;
    float liquid = (1.0 - p) * (1.0 - p);

    vec2 wave = vec2(
      sin(uv.y * 6.0 + t * 1.3) * 0.045 + sin(uv.y * 14.0 - t * 2.1) * 0.025,
      sin(uv.x * 5.0 - t * 1.1) * 0.04 + sin(uv.x * 12.0 + t * 1.7) * 0.02
    );
    wave += vec2(sin(uv.y * 42.0 + t * 6.0), cos(uv.x * 38.0 - t * 5.0)) * 0.006;
    vec2 base = clamp(uv + wave * liquid, 0.001, 0.999);
    vec2 shift = vec2(0.012 * liquid, 0.0);
    vec3 color = vec3(
      texture2D(tMap, clamp(base + shift, 0.001, 0.999)).r,
      texture2D(tMap, base).g,
      texture2D(tMap, clamp(base - shift, 0.001, 0.999)).b
    );

    // The photo rises from the bottom behind a soft wavy edge.
    float edgeWave = (sin(uv.x * 7.0 + t * 2.0) * 0.03 + sin(uv.x * 13.0 - t * 3.0) * 0.015) * (1.0 - p);
    float edge = mix(-0.09, 1.04, p) + edgeWave;
    float mask = 1.0 - smoothstep(edge - 0.035, edge, uv.y);

    gl_FragColor = vec4(color * mask, mask);
  }
`;
