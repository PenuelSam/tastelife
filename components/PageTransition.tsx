"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mesh, Program, Renderer, Triangle, Vec2 } from "ogl";
import { useLenis } from "./SmoothScroll";
import styles from "./PageTransition.module.css";

const DURATION_MS = 1300;
const MAX_COVERED_MS = 5000;

const COVER = 0;
const UNCOVER = 1;
type Mode = typeof COVER | typeof UNCOVER;

const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

type Engine = {
  play: (mode: Mode, onDone: () => void) => void;
  destroy: () => void;
};

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

function createEngine(): Engine | null {
  if (!hasWebGL()) return null;

  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const renderer = new Renderer({
    canvas,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  const uniforms = {
    uProgress: { value: 0 },
    uMode: { value: COVER as number },
    uTime: { value: 0 },
    uResolution: { value: new Vec2(1, 1) },
  };
  const mesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, { vertex, fragment, uniforms, transparent: true }),
  });

  let raf = 0;
  let visible = false;

  const draw = () => renderer.render({ scene: mesh });

  const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    if (visible) draw();
  };
  resize();
  window.addEventListener("resize", resize);
  draw();

  return {
    play(mode, onDone) {
      cancelAnimationFrame(raf);
      visible = true;
      canvas.style.visibility = "visible";
      uniforms.uMode.value = mode;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        uniforms.uProgress.value = easeInOutQuad(t);
        uniforms.uTime.value = now / 1000;
        draw();
        if (t < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        raf = 0;
        if (mode === UNCOVER) {
          visible = false;
          canvas.style.visibility = "hidden";
        }
        onDone();
      };
      raf = requestAnimationFrame(tick);
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}

type PageTransition = { navigate: (href: string) => void };

const PageTransitionContext = createContext<PageTransition | null>(null);

export function usePageTransition(): PageTransition {
  const ctx = useContext(PageTransitionContext);
  const router = useRouter();
  return ctx ?? { navigate: (href) => router.push(href) };
}

type Phase = "idle" | "covering" | "covered" | "uncovering";

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const engineRef = useRef<Engine | null>(null);
  const pathnameRef = useRef(pathname);
  const stateRef = useRef({ phase: "idle" as Phase, target: null as string | null, timeout: 0 });

  useEffect(() => {
    const engine = createEngine();
    engineRef.current = engine;
    const state = stateRef.current;
    return () => {
      window.clearTimeout(state.timeout);
      state.phase = "idle";
      engine?.destroy();
      engineRef.current = null;
    };
  }, []);

  const uncover = useCallback(() => {
    const state = stateRef.current;
    const engine = engineRef.current;
    if (state.phase !== "covered" || !engine) return;
    window.clearTimeout(state.timeout);
    state.phase = "uncovering";
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        engine.play(UNCOVER, () => {
          state.phase = "idle";
          state.target = null;
        })
      )
    );
  }, []);

  useEffect(() => {
    pathnameRef.current = pathname;
    if (stateRef.current.target === pathname) uncover();
  }, [pathname, uncover]);

  const navigate = useCallback(
    (href: string) => {
      const state = stateRef.current;
      const engine = engineRef.current;
      if (state.phase !== "idle") return;

      const targetPath = new URL(href, window.location.href).pathname;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!engine || reduced || targetPath === pathnameRef.current) {
        router.push(href);
        return;
      }

      router.prefetch(href);
      state.phase = "covering";
      state.target = targetPath;
      engine.play(COVER, () => {
        state.phase = "covered";
        if (lenis) lenis.current?.scrollTo(0, { immediate: true, force: true });
        state.timeout = window.setTimeout(uncover, MAX_COVERED_MS);
        router.push(href);
      });
    },
    [router, lenis, uncover]
  );

  const value = useMemo(() => ({ navigate }), [navigate]);
  return <PageTransitionContext.Provider value={value}>{children}</PageTransitionContext.Provider>;
}

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function TransitionLink({ href, onClick, ...rest }: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (rest.target && rest.target !== "_self") return;
        e.preventDefault();
        navigate(href);
      }}
    />
  );
}

const vertex = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = `
  precision highp float;

  uniform float uProgress;
  uniform float uMode;
  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  const vec3 LIQUID = vec3(158.0, 23.0, 18.0) / 255.0;
  const vec3 BAND = vec3(192.0, 46.0, 34.0) / 255.0;

  float drips(float x, float seed) {
    return pow(max(sin(x * 2.3 + seed), 0.0), 60.0)
      + pow(max(sin(x * 3.7 + seed * 1.7 + 1.3), 0.0), 90.0) * 0.7
      + pow(max(sin(x * 1.3 + seed * 2.3 + 4.1), 0.0), 120.0) * 0.85;
  }

  float waves(float x, float seed) {
    return sin(x * 4.0 + seed + uTime * 1.5) * 0.5 + sin(x * 9.0 - seed * 1.3 - uTime * 2.0) * 0.25;
  }

  void main() {
    float x = vUv.x * (uResolution.x / uResolution.y) * 3.0;
    float y = 1.0 - vUv.y;
    float p = uProgress;

    float shape = sin(3.14159265 * p);

    float dist;
    if (uMode < 0.5) {
      float front = mix(-0.04, 1.04, p) + shape * (0.018 * waves(x, 0.0) + 0.07 * drips(x, 0.0));
      dist = front - y;
    } else {
      float back = mix(-0.04, 1.04, p) + shape * (0.018 * waves(x, 5.0) - 0.06 * drips(x, 11.0));
      dist = y - back;
    }

    float aa = 2.0 / uResolution.y;
    float alpha = smoothstep(-aa, aa, dist);
    float band = 1.0 - smoothstep(0.0, 0.05, dist);
    vec3 color = mix(LIQUID, BAND, band * 0.6);
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;
