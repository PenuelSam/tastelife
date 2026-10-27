"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { lanes, nextLane, visibleItems, type LaneItem, type LaneSlug } from "@/data/lanes";
import MobileMenu from "../MobileMenu";
import { TransitionLink } from "../PageTransition";
import { primeDetailVideo } from "./detailVideo";
import LaneDetail from "./LaneDetail";
import LaneHoverLiquid from "./LaneHoverLiquid";
import LaneMedia from "./LaneMedia";
import { DESKTOP_SLOTS, MOBILE_SLOTS, PARALLAX, ratio, widen } from "./layout";
import styles from "./LanePage.module.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const REDUCED = "(prefers-reduced-motion: reduce)";
const MOBILE = "(max-width: 767px)";

const Gallery = memo(function Gallery({ items, onOpen }: { items: LaneItem[]; onOpen: (id: string) => void }) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || window.matchMedia(REDUCED).matches) return;
    const mobile = window.matchMedia(MOBILE);
    const slots = [...list.querySelectorAll<HTMLElement>("[data-speed]")];
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const factor = mobile.matches ? 0.5 : 1;
      for (const slot of slots) {
        const r = slot.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const offset = r.top + r.height / 2 - vh / 2;
        const inner = slot.firstElementChild as HTMLElement;
        inner.style.transform = `translate3d(0, ${(-offset * Number(slot.dataset.speed) * factor).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const slot of slots) (slot.firstElementChild as HTMLElement).style.transform = "";
    };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );
    list.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ul ref={listRef} className={styles.scatter}>
      {items.map((item, i) => {
        const slot = i % DESKTOP_SLOTS.length;
        const d = DESKTOP_SLOTS[slot];
        const m = MOBILE_SLOTS[slot];
        const landscape = item.kind !== "card" && ratio(item.aspect) > 1;
        const vars = {
          "--col": landscape ? widen(d.col, 4) : d.col,
          "--mt": `${d.mt}px`,
          "--ar": landscape ? item.aspect : d.ar,
          "--col-m": landscape ? widen(m.col, 7) : m.col,
          "--mt-m": `${m.mt}px`,
          "--ar-m": landscape ? item.aspect : m.ar,
        } as CSSProperties;
        return (
          <li key={item.id} className={styles.slot} style={vars} data-reveal data-speed={PARALLAX[slot]}>
            <button
              type="button"
              className={styles.item}
              data-item-id={item.id}
              onClick={() => onOpen(item.id)}
              aria-label={`Open ${item.title}`}
            >
              <span
                className={styles.media}
                data-tile-media
                data-liquid={item.kind === "image" && item.src ? "" : undefined}
              >
                <LaneMedia item={item} variant="grid" eager={i < 3} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
});

export default function LanePage({ slug }: { slug: LaneSlug }) {
  const lane = lanes[slug];
  const items = useMemo(() => visibleItems(lanes[slug]), [slug]);
  const next = lanes[nextLane[slug]];
  const pathname = usePathname();
  const bandRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const lastOpenRef = useRef<string | null>(null);

  const openId = pathname.split("/")[2] ?? null;
  const openIndex = openId ? items.findIndex((item) => item.id === openId) : -1;

  const open = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (item) primeDetailVideo(item);
      window.history.pushState(null, "", `/${slug}/${id}`);
      pushedRef.current = true;
    },
    [items, slug]
  );
  const show = (index: number) => window.history.replaceState(null, "", `/${slug}/${items[index].id}`);
  const close = () => {
    if (pushedRef.current) window.history.back();
    else window.history.replaceState(null, "", `/${slug}`);
  };

  useEffect(() => {
    if (openIndex >= 0) {
      lastOpenRef.current = items[openIndex].id;
      return;
    }
    pushedRef.current = false;
    const id = lastOpenRef.current;
    lastOpenRef.current = null;
    if (id) document.querySelector<HTMLElement>(`[data-item-id="${id}"]`)?.focus({ preventScroll: true });
  }, [openIndex, items]);

  useGSAP(
    () => {
      const band = bandRef.current;
      const title = titleRef.current;
      if (!band || !title || window.matchMedia(REDUCED).matches) return;
      gsap.fromTo(
        title,
        { scale: 1, opacity: 1 },
        {
          scale: 0.92,
          opacity: 0.4,
          ease: "none",
          scrollTrigger: { start: 0, end: () => band.offsetHeight, scrub: true, invalidateOnRefresh: true },
        }
      );
    },
    { scope: bandRef }
  );

  const twoLines = lane.titleLines.length > 1;
  const bandVars = {
    "--band-h-mobile": twoLines ? "250px" : "200px",
    "--title-mobile": twoLines ? "64px" : "72px",
  } as CSSProperties;

  return (
    <main className={styles.page} data-theme="paper">
      <section ref={bandRef} className={styles.band} style={bandVars} aria-labelledby="lane-title">
        <div className={styles.bandTop}>
          <TransitionLink href="/work" className={styles.backLink} aria-label="Back to all work">
            <svg className={styles.backArrow} viewBox="0 0 28 18" aria-hidden="true">
              <path d="M26 9H3M10 2 3 9l7 7" />
            </svg>
          </TransitionLink>
          <TransitionLink href="/about" className={`${styles.bandLink} ${styles.desktopOnly}`}>
            About
          </TransitionLink>
          <MobileMenu />
        </div>

        <div className={styles.bandTitleWrap}>
          <h1 ref={titleRef} id="lane-title" className={styles.bandTitle}>
            {lane.titleLines.map((line, i) => (
              <Fragment key={line}>
                {i > 0 && <br className={styles.mobileBreak} />}
                {i > 0 ? ` ${line}` : line}
              </Fragment>
            ))}
          </h1>
        </div>
      </section>

      <div ref={sheetRef} className={styles.sheet}>
        <div className={styles.bar}>
          <TransitionLink href="/work" className={styles.barLink}>
            All work
          </TransitionLink>
        </div>

        <Gallery items={items} onOpen={open} />

        <footer className={styles.footer}>
          <TransitionLink href={`/${next.slug}`} className={styles.nextPill}>
            <span>{`Next lane: ${next.title}`}</span>
            <svg className={styles.nextArrow} viewBox="0 0 22 14" aria-hidden="true">
              <path d="M0 7h19M13 1l6 6-6 6" />
            </svg>
          </TransitionLink>
        </footer>
      </div>

      {openIndex >= 0 && (
        <LaneDetail title={lane.title} items={items} index={openIndex} onShow={show} onClose={close} />
      )}
      <LaneHoverLiquid rootRef={sheetRef} />
    </main>
  );
}
