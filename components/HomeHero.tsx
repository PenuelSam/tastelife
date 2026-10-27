"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LiquidPhoto, { type LiquidPhotoHandle } from "./LiquidPhoto";
import { TransitionLink } from "./PageTransition";
import styles from "./HomeHero.module.css";

gsap.registerPlugin(useGSAP);

const MEASURE_SIZE = 200;
const WORDS = ["PORT", "FOLIO"];

type WordMetrics = {
  word: string;
  viewBox: string;
  height: number;
  xs: number[];
};

function measureWord(ctx: CanvasRenderingContext2D, word: string): WordMetrics {
  const m = ctx.measureText(word);
  const left = m.actualBoundingBoxLeft;
  const width = left + m.actualBoundingBoxRight;
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const xs = [...word].map((_, i) => ctx.measureText(word.slice(0, i)).width);
  return {
    word,
    viewBox: `${-left} ${-m.actualBoundingBoxAscent} ${width} ${height}`,
    height,
    xs,
  };
}

export default function HomeHero() {
  const heroRef = useRef<HTMLElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<LiquidPhotoHandle>(null);
  const [metrics, setMetrics] = useState<WordMetrics[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const box = portfolioRef.current;
    if (!box) return;

    const family = getComputedStyle(box).fontFamily;
    const font = `400 ${MEASURE_SIZE}px ${family}`;

    document.fonts
      .load(font, WORDS.join(""))
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return;
        ctx.font = font;
        ctx.textBaseline = "alphabetic";
        setMetrics(WORDS.map((word) => measureWord(ctx, word)));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero || !metrics) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const q = gsap.utils.selector(hero);
      const nav = document.querySelector<HTMLElement>("[data-site-nav]");
      const inner = q(`.${styles.inner}`);
      const topRow = q(`.${styles.topRow}`);
      const words = q(`.${styles.word}`);
      const bar = q(`.${styles.bar}`);
      const stage = q(`.${styles.stage}`);
      const stageInner = q(`.${styles.stageInner}`);
      const letters = q(`.${styles.letter}`);
      const names = q(`.${styles.maskInner}`);
      const enter = q(`.${styles.enter}`);
      const label = q(`.${styles.labelInner}`);
      const sheen = q(`.${styles.sheen}`);
      const arrow = q(`.${styles.arrow}`);

      const rowTop = (topRow[0] as HTMLElement).getBoundingClientRect().top + window.scrollY;
      const rowH = (topRow[0] as HTMLElement).offsetHeight;
      const lead = Math.max(0, (window.innerHeight - rowH) / 2 - rowTop);
      gsap.set(inner, { marginTop: lead });
      gsap.set(topRow, { columnGap: 5 });
      gsap.set(words, { opacity: 0, letterSpacing: "0.3em" });
      gsap.set(bar, { flexGrow: 0 });
      gsap.set(stage, { height: 0, overflow: "hidden" });
      gsap.set(stageInner, { scaleY: 0.55, transformOrigin: "50% 100%" });
      gsap.set(letters, { y: (_: number, el: SVGTextElement) => Number(el.dataset.rise) });
      gsap.set(names, { yPercent: 110 });
      gsap.set(enter, { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(label, { yPercent: 110 });
      gsap.set(sheen, { xPercent: -200, skewX: -20, opacity: 0.5 });
      if (nav) gsap.set(nav, { autoAlpha: 0, y: -16 });
      gsap.set(hero, { autoAlpha: 1 });
      hero.removeAttribute("data-home-intro");

      const sweep = 1.1;
      const loop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 3.4 - sweep });
      loop
        .fromTo(sheen, { xPercent: -200 }, { xPercent: 600, duration: sweep, ease: "power2.inOut" }, 0)
        .to(arrow, { x: 5, duration: 0.14, ease: "power1.inOut", yoyo: true, repeat: 3 }, 0.3);

      let introDone = false;
      const tl = gsap.timeline();

      tl.to(words, { opacity: 1, letterSpacing: "0.01em", duration: 1, ease: "power3.out" }, 0);

      tl.to(inner, { marginTop: 0, duration: 1.2, ease: "power3.inOut" }, 0.7)
        .to(stage, { height: "auto", duration: 1.2, ease: "back.out(1.3)" }, 0.7)
        .to(stageInner, { scaleY: 1, duration: 1.2, ease: "back.out(1.6)" }, 0.7)
        .to(letters, { y: 0, duration: 0.9, ease: "power4.out", stagger: 0.08 }, 0.85)
        .call(() => photoRef.current?.start(), undefined, 1.4);

      tl.to(bar, { flexGrow: 1, duration: 1.1, ease: "expo.inOut" }, 1.9)
        .to(topRow, { columnGap: 16, duration: 1.1, ease: "expo.inOut" }, 1.9)
        .to(names, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.1 }, 2.1);

      tl.to(enter, { scaleX: 1, duration: 0.7, ease: "expo.inOut" }, 2.9)
        .to(label, { yPercent: 0, duration: 0.5, ease: "power3.out" }, 3.45);

      if (nav) tl.to(nav, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 4.05);

      tl.set(inner, { clearProps: "marginTop" })
        .set(topRow, { clearProps: "columnGap" })
        .set(stage, { clearProps: "height,overflow" })
        .set(stageInner, { clearProps: "transform" })
        .set(enter, { clearProps: "transform" })
        .call(() => {
          introDone = true;
          loop.play(0);
        }, undefined, "+=0.4");

      const enterEl = enter[0] as HTMLElement | undefined;
      const pause = () => loop.pause();
      const resume = () => {
        if (introDone) loop.resume();
      };
      enterEl?.addEventListener("mouseenter", pause);
      enterEl?.addEventListener("mouseleave", resume);
      enterEl?.addEventListener("focus", pause);
      enterEl?.addEventListener("blur", resume);

      return () => {
        enterEl?.removeEventListener("mouseenter", pause);
        enterEl?.removeEventListener("mouseleave", resume);
        enterEl?.removeEventListener("focus", pause);
        enterEl?.removeEventListener("blur", resume);
      };
    },
    { scope: heroRef, dependencies: [metrics] }
  );

  return (
    <main ref={heroRef} className={styles.hero} data-home-intro>
      <div className={styles.inner}>
        <p className={styles.topRow}>
          <span className={styles.word}>Taste</span>
          <span className={styles.bar} aria-hidden="true" />
          <span className={styles.word}>Life</span>
        </p>

        <div className={styles.stage}>
          <div className={styles.stageInner}>
            <h1 ref={portfolioRef} className={styles.portfolio}>
              <span className={styles.visuallyHidden}>Portfolio</span>
              {metrics?.map((m) => (
                <svg
                  key={m.word}
                  className={styles.wordSvg}
                  viewBox={m.viewBox}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  {[...m.word].map((letter, i) => (
                    <text
                      key={i}
                      className={styles.letter}
                      x={m.xs[i]}
                      y={0}
                      fontSize={MEASURE_SIZE}
                      data-rise={m.height * 1.05}
                    >
                      {letter}
                    </text>
                  ))}
                </svg>
              ))}
            </h1>

            <div className={styles.right}>
              <div className={styles.frame}>
                <LiquidPhoto
                  ref={photoRef}
                  src="/images/taiwo-portrait.svg"
                  alt="Portrait of Taiwo Adeoshun"
                />
              </div>
              <div className={styles.names}>
                <div className={styles.nameRow}>
                  <span className={styles.mask}>
                    <span className={styles.maskInner}>Taiwo</span>
                  </span>
                  <TransitionLink href="/work" className={styles.enter}>
                    <span className={styles.sheen} aria-hidden="true" />
                    <span className={styles.label}>
                      <span className={styles.labelInner}>
                        Enter
                        <span className={styles.arrowHover} aria-hidden="true">
                          <svg className={styles.arrow} viewBox="0 0 22 14">
                            <path d="M0 7h19M13 1l6 6-6 6" />
                          </svg>
                        </span>
                      </span>
                    </span>
                  </TransitionLink>
                </div>
                <span className={styles.mask}>
                  <span className={styles.maskInner}>Adeoshun</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
