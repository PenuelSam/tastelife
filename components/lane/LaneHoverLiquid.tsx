"use client";

import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { Flowmap, Mesh, Program, Renderer, Texture, Triangle, Vec2 } from "ogl";
import { fullscreenVertex, hasFinePointer, hasWebGL, noiseGLSL, prefersReducedMotion } from "./gl";
import styles from "./LanePage.module.css";

const HOVER_STRENGTH = 0.35;

export default function LaneHoverLiquid({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !hasFinePointer() || prefersReducedMotion() || !hasWebGL()) return;

    const canvas = document.createElement("canvas");
    canvas.className = `${styles.fill} ${styles.liquidCanvas}`;
    canvas.setAttribute("aria-hidden", "true");

    const renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 2), antialias: false });
    const gl = renderer.gl;

    let flowmap: Flowmap | null = null;
    try {
      flowmap = new Flowmap(gl, { falloff: 0.25, alpha: 0.6, dissipation: 0.93 });
    } catch {
      flowmap = null;
    }
    const empty = new Texture(gl, { image: new Uint8Array([0, 0, 0, 255]), width: 1, height: 1, generateMipmaps: false });

    const uniforms = {
      tMap: { value: empty },
      tFlow: { value: empty },
      uStrength: { value: 0 },
      uTime: { value: 0 },
      uImageSize: { value: new Vec2(1, 1) },
      uResolution: { value: new Vec2(1, 1) },
    };
    const mesh = new Mesh(gl, {
      geometry: new Triangle(gl),
      program: new Program(gl, { vertex: fullscreenVertex, fragment, uniforms }),
    });

    const textures = new Map<string, Texture>();
    const hover = { value: 0 };
    let velocity = 0;
    let frame: HTMLElement | null = null;
    let hovering = false;
    let last: { x: number; y: number; t: number } | null = null;
    let raf = 0;

    const tick = (now: number) => {
      raf = 0;
      if (!frame) return;
      velocity *= 0.94;
      if (!hovering && hover.value <= 0.001 && velocity < 0.01) {
        detach();
        return;
      }
      uniforms.uStrength.value = hover.value + velocity * 0.25;
      uniforms.uTime.value = now / 1000;
      if (flowmap) {
        flowmap.velocity.lerp(new Vec2(0, 0), 0.1);
        flowmap.update();
        uniforms.tFlow.value = flowmap.uniform.value ?? empty;
      }
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(tick);
    };

    const detach = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.remove();
      frame = null;
      last = null;
    };

    const enter = (target: HTMLElement) => {
      const img = target.querySelector("img");
      if (!img || !img.complete || !img.naturalWidth) return;
      hovering = true;
      gsap.killTweensOf(hover);
      if (frame !== target) {
        frame = target;
        const w = target.clientWidth;
        const h = target.clientHeight;
        renderer.setSize(w, h);
        uniforms.uResolution.value.set(w, h);
        uniforms.uImageSize.value.set(img.naturalWidth, img.naturalHeight);
        const key = img.currentSrc || img.src;
        let texture = textures.get(key);
        if (!texture) {
          texture = new Texture(gl, { image: img, generateMipmaps: false });
          textures.set(key, texture);
        }
        uniforms.tMap.value = texture;
        if (flowmap) flowmap.aspect = w / h;
        target.appendChild(canvas);
      }
      gsap.to(hover, { value: HOVER_STRENGTH, duration: 0.6, ease: "power2.out" });
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const leave = () => {
      hovering = false;
      gsap.to(hover, { value: 0, duration: 0.6, ease: "power2.inOut" });
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = (e.target as Element).closest<HTMLElement>("[data-liquid]");
      if (target && (target !== frame || !hovering)) enter(target);
    };
    const onOut = (e: PointerEvent) => {
      if (!frame) return;
      const to = e.relatedTarget as Node | null;
      if (to && frame.contains(to)) return;
      leave();
    };
    const onMove = (e: PointerEvent) => {
      if (!frame || e.pointerType !== "mouse") return;
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const now = performance.now();
      if (last) {
        const dt = Math.max(8, now - last.t);
        const dx = (x - last.x) * r.width;
        const dy = (y - last.y) * r.height;
        velocity = Math.min(1, velocity + Math.hypot(dx, dy) / dt / 4);
        if (flowmap) flowmap.velocity.set((dx / dt) * 0.6, (dy / dt) * 0.6);
      }
      if (flowmap) flowmap.mouse.set(x, 1 - y);
      last = { x, y, t: now };
    };

    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerout", onOut);
    root.addEventListener("pointermove", onMove);
    return () => {
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("pointermove", onMove);
      gsap.killTweensOf(hover);
      detach();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [rootRef]);

  return null;
}

const fragment = `
  precision highp float;

  uniform sampler2D tMap;
  uniform sampler2D tFlow;
  uniform float uStrength;
  uniform float uTime;
  uniform vec2 uImageSize;
  uniform vec2 uResolution;

  varying vec2 vUv;

  ${noiseGLSL}

  vec2 cover(vec2 uv) {
    float canvasAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 scale = canvasAspect > imageAspect
      ? vec2(1.0, imageAspect / canvasAspect)
      : vec2(canvasAspect / imageAspect, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.25;
    vec2 noise = vec2(
      fbm(uv * 2.5 + vec2(t, -t * 0.6)),
      fbm(uv * 2.5 + vec2(-t * 0.7, t) + 7.3)
    );
    vec2 flow = texture2D(tFlow, uv).rg;
    vec2 offset = noise * 0.08 * uStrength - flow * 0.04;
    gl_FragColor = texture2D(tMap, clamp(cover(uv + offset), 0.001, 0.999));
  }
`;
