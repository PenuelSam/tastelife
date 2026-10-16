"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { Flowmap, Mesh, Program, Renderer, Texture, Triangle, Vec2, Vec3 } from "ogl";
import styles from "./LiquidPhoto.module.css";

export type LiquidPhotoHandle = {
  /** Plays the liquid reveal once. Later calls are ignored. */
  start: () => void;
};

type Props = {
  src: string;
  alt: string;
  ref?: Ref<LiquidPhotoHandle>;
};

const REVEAL_MS = 2600;
// Keep rendering this long after the last pointer event so the flow can settle.
const IDLE_MS = 2500;

const rgb = (r: number, g: number, b: number): [number, number, number] => [r / 255, g / 255, b / 255];
const BASE = rgb(184, 31, 23); // #B81F17, matches the frame background
const DARK = rgb(77, 5, 10);
const LIGHT = rgb(255, 179, 158);

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type Source = HTMLImageElement | HTMLCanvasElement;

const sourceSize = (s: Source) =>
  s instanceof HTMLImageElement ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height];

/** Grey head-and-shoulders placeholder used when the photo can't load. */
function silhouette(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 750;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.fillStyle = "#c4c4c4";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#6e6e6e";
  ctx.beginPath();
  ctx.arc(300, 290, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(300, 750, 230, 280, 0, Math.PI, 0);
  ctx.fill();
  return c;
}

function loadSource(src: string): Promise<Source> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img.naturalWidth ? img : silhouette());
    img.onerror = () => resolve(silhouette());
    img.src = src;
  });
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

/** Static fallback without WebGL: cover-fit duotone drawn once on a 2D canvas. */
function drawStatic(canvas: HTMLCanvasElement, source: Source, w: number, h: number, dpr: number) {
  const cw = Math.round(w * dpr);
  const ch = Math.round(h * dpr);
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  const [iw, ih] = sourceSize(source);
  const scale = Math.max(cw / iw, ch / ih);
  ctx.drawImage(source, (cw - iw * scale) / 2, (ch - ih * scale) / 2, iw * scale, ih * scale);
  try {
    const data = ctx.getImageData(0, 0, cw, ch);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const l = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      px[i] = (DARK[0] + (LIGHT[0] - DARK[0]) * l) * 255;
      px[i + 1] = (DARK[1] + (LIGHT[1] - DARK[1]) * l) * 255;
      px[i + 2] = (DARK[2] + (LIGHT[2] - DARK[2]) * l) * 255;
    }
    ctx.putImageData(data, 0, 0);
  } catch {
    // Pixel access blocked: leave the plain photo.
  }
}

export default function LiquidPhoto({ src, alt, ref }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef({ revealStart: null as number | null, kick: () => {} });

  useImperativeHandle(
    ref,
    () => ({
      start() {
        const engine = engineRef.current;
        if (engine.revealStart !== null) return;
        engine.revealStart = performance.now();
        engine.kick();
      },
    }),
    []
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = wrap?.parentElement;
    if (!wrap || !frame) return;

    const engine = engineRef.current;
    // Each mount plays its own reveal (Next can hide and re-show this page).
    engine.revealStart = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);

    // A fresh canvas per mount, so a lost context is never reused.
    const canvas = document.createElement("canvas");
    canvas.className = styles.canvas;
    wrap.appendChild(canvas);

    let disposed = false;
    const cleanups: Array<() => void> = [];
    const dispose = () => {
      disposed = true;
      engine.kick = () => {};
      cleanups.forEach((fn) => fn());
      canvas.remove();
    };

    if (!hasWebGL()) {
      let source: Source | null = null;
      const draw = () => {
        if (source) drawStatic(canvas, source, wrap.clientWidth, wrap.clientHeight, dpr);
      };
      loadSource(src).then((s) => {
        if (disposed) return;
        source = s;
        draw();
      });
      const ro = new ResizeObserver(draw);
      ro.observe(frame);
      cleanups.push(() => ro.disconnect());
      return dispose;
    }

    const renderer = new Renderer({ canvas, dpr, antialias: false, webgl: 2 });
    const gl = renderer.gl;
    cleanups.push(() => gl.getExtension("WEBGL_lose_context")?.loseContext());

    const empty = new Texture(gl, {
      image: new Uint8Array([0, 0, 0, 255]),
      width: 1,
      height: 1,
      generateMipmaps: false,
    });

    const uniforms = {
      tMap: { value: empty },
      tFlow: { value: empty },
      uImageSize: { value: new Vec2(1, 1) },
      uResolution: { value: new Vec2(1, 1) },
      uReveal: { value: reduced ? 1 : 0 },
      uTime: { value: 0 },
      uFlowAmount: { value: 0 },
      uSpeed: { value: 0 },
      uMouse: { value: new Vec2(-1, -1) },
      uBase: { value: new Vec3(...BASE) },
      uDark: { value: new Vec3(...DARK) },
      uLight: { value: new Vec3(...LIGHT) },
    };
    const program = new Program(gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let raf = 0;
    let ready = false;
    let visible = true;
    let flowmap: Flowmap | null = null;
    let lastPointer = 0;
    let moved = false;
    let speed = 0;
    const targetVelocity = new Vec2();
    const canInteract = !reduced && !touch;

    const enableInteraction = () => {
      try {
        flowmap = new Flowmap(gl, { falloff: 0.25, alpha: 0.6, dissipation: 0.93 });
      } catch {
        return; // No half-float render targets: the photo just stays still.
      }
      flowmap.aspect = wrap.clientWidth / wrap.clientHeight || 1;
      uniforms.uFlowAmount.value = 1;

      let last: { x: number; y: number; t: number } | null = null;
      const onMove = (e: PointerEvent) => {
        if (!flowmap || e.pointerType === "touch") return;
        const r = canvas.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        flowmap.mouse.set(x / r.width, 1 - y / r.height);
        uniforms.uMouse.value.copy(flowmap.mouse);
        const now = performance.now();
        if (last) {
          // px per ms, y down (the flowmap flips y in its stamp).
          const dt = Math.max(10.4, now - last.t);
          targetVelocity.set((x - last.x) / dt, (y - last.y) / dt);
          moved = true;
        }
        last = { x, y, t: now };
        lastPointer = now;
        engine.kick();
      };
      const onLeave = () => {
        last = null;
        flowmap?.mouse.set(-1, -1);
        targetVelocity.set(0, 0);
        lastPointer = performance.now();
        engine.kick();
      };
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
      });
    };

    const tick = (now: number) => {
      raf = 0;
      if (disposed || !ready || !visible || document.hidden) return;

      let reveal = 1;
      let revealing = false;
      if (!reduced) {
        const start = engine.revealStart;
        const progress = start === null ? 0 : Math.min(1, (now - start) / REVEAL_MS);
        reveal = easeOutCubic(progress);
        revealing = start !== null && progress < 1;
        if (progress >= 1 && canInteract && !flowmap) enableInteraction();
      }
      uniforms.uReveal.value = reveal;
      uniforms.uTime.value = now / 1000;

      if (flowmap) {
        if (!moved) targetVelocity.set(0, 0);
        moved = false;
        flowmap.velocity.lerp(targetVelocity, targetVelocity.len() ? 0.5 : 0.1);
        speed += (Math.min(1, flowmap.velocity.len() * 0.5) - speed) * 0.12;
        uniforms.uSpeed.value = speed;
        flowmap.update();
        uniforms.tFlow.value = flowmap.uniform.value ?? empty;
      }

      renderer.render({ scene: mesh });

      const settling = !!flowmap && (now - lastPointer < IDLE_MS || speed > 0.001);
      if (revealing || settling) raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(tick);
    };
    engine.kick = kick;
    cleanups.push(() => cancelAnimationFrame(raf));

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
      if (flowmap) flowmap.aspect = w / h;
      kick();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(frame);
    cleanups.push(() => ro.disconnect());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    cleanups.push(() => io.disconnect());

    const onVisibility = () => {
      if (!document.hidden) kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

    loadSource(src).then((source) => {
      if (disposed) return;
      const [w, h] = sourceSize(source);
      uniforms.tMap.value = new Texture(gl, { image: source, generateMipmaps: false });
      uniforms.uImageSize.value.set(w, h);
      ready = true;
      kick();
    });

    return dispose;
  }, [src]);

  return <div ref={wrapRef} className={styles.root} role="img" aria-label={alt} />;
}

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform sampler2D tMap;
  uniform sampler2D tFlow;
  uniform vec2 uImageSize;
  uniform vec2 uResolution;
  uniform float uReveal;
  uniform float uTime;
  uniform float uFlowAmount;
  uniform float uSpeed;
  uniform vec2 uMouse;
  uniform vec3 uBase;
  uniform vec3 uDark;
  uniform vec3 uLight;

  varying vec2 vUv;

  // object-fit: cover, clamped so displacement never shows the image edges.
  vec2 cover(vec2 uv) {
    float canvasAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 scale = canvasAspect > imageAspect
      ? vec2(1.0, imageAspect / canvasAspect)
      : vec2(canvasAspect / imageAspect, 1.0);
    return clamp((uv - 0.5) * scale + 0.5, 0.0, 1.0);
  }

  float luma(vec2 uv) {
    return dot(texture2D(tMap, cover(uv)).rgb, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;
    float aspect = uResolution.x / uResolution.y;

    // Part 1: liquid distortion while revealing, gone at reveal = 1.
    float liquid = (1.0 - uReveal) * (1.0 - uReveal);
    vec2 wave = vec2(
      sin(uv.y * 6.0 + t * 1.3) * 0.045 + sin(uv.y * 14.0 - t * 2.1) * 0.025,
      sin(uv.x * 5.0 - t * 1.1) * 0.04 + sin(uv.x * 12.0 + t * 1.7) * 0.02
    );
    wave += vec2(sin(uv.y * 42.0 + t * 6.0), cos(uv.x * 38.0 - t * 5.0)) * 0.006;
    vec2 offset = wave * liquid;
    float split = 0.012 * liquid;

    // Part 2: cursor flow, at most 4.5% of the frame.
    vec2 flow = texture2D(tFlow, uv).rg * 0.03 * uFlowAmount;
    flow *= min(1.0, 0.045 / max(length(flow), 0.0001));
    offset -= flow;

    vec2 toMouse = uv - uMouse;
    toMouse.x *= aspect;
    float dist = length(toMouse);
    float k = (dist - (0.05 + uSpeed * 0.12)) / 0.035;
    float ring = exp(-k * k) * uSpeed * uFlowAmount;
    vec2 dir = toMouse / max(dist, 0.0001);
    dir.x /= aspect;
    offset += dir * sin(dist * 70.0 - t * 9.0) * 0.006 * ring;
    split += length(flow) * 0.18;

    // Red duotone with a slight channel split.
    vec2 base = uv + offset;
    vec2 shift = vec2(split, 0.0);
    vec3 duo = vec3(
      mix(uDark.r, uLight.r, luma(base + shift)),
      mix(uDark.g, uLight.g, luma(base)),
      mix(uDark.b, uLight.b, luma(base - shift))
    );

    // Wavy edge rising from just below the frame to just above it.
    float edgeWave = (sin(uv.x * 7.0 + t * 2.0) * 0.03 + sin(uv.x * 13.0 - t * 3.0) * 0.015) * (1.0 - uReveal);
    float edge = mix(-0.09, 1.04, uReveal) + edgeWave;
    float mask = 1.0 - smoothstep(edge - 0.035, edge, uv.y);

    gl_FragColor = vec4(mix(uBase, duo, mask), 1.0);
  }
`;
