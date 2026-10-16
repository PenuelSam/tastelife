"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePageTransition } from "./PageTransition";
import { useLenis } from "./SmoothScroll";
import styles from "./MobileMenu.module.css";

gsap.registerPlugin(useGSAP);

const NAME = "Taiwo Adeoshun";
const EMAIL = "[email]";
const INSTAGRAM_URL = "[instagram]";

const WORK_LINKS = [
  { label: "Fashion design", href: "/fashion-design" },
  { label: "Styling", href: "/styling" },
  { label: "Modeling", href: "/modeling" },
];

const DESKTOP_QUERY = "(min-width: 768px)";
// Closing replays the open timeline backwards at this speed (~0.4s).
const CLOSE_SPEED = 3.2;

const noopSubscribe = () => () => {};
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function MobileMenu() {
  // The overlay is portalled to <body>, which only exists on the client.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const lenis = useLenis();
  const { navigate } = usePageTransition();
  const menuId = useId();

  const overlayRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const instantCloseRef = useRef(false);
  const skipFocusReturnRef = useRef(false);
  const wasOpenRef = useRef(false);

  // Close on route change.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useGSAP(
    () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const q = gsap.utils.selector(overlay);
      timelineRef.current = gsap
        .timeline({
          paused: true,
          onReverseComplete: () => {
            gsap.set(overlay, { visibility: "hidden" });
          },
        })
        .fromTo(
          overlay,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "power3.inOut" }
        )
        .fromTo(
          q(`.${styles.wordInner}`),
          { yPercent: 110 },
          { yPercent: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 },
          0.35
        )
        .fromTo(
          q(`.${styles.fade}`),
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", stagger: 0.05 },
          0.6
        );
    },
    { dependencies: [isClient], scope: overlayRef }
  );

  // Play the open/close animation, lock scrolling and move focus.
  useEffect(() => {
    const overlay = overlayRef.current;
    const tl = timelineRef.current;
    if (!overlay || !tl) return;

    if (open) {
      wasOpenRef.current = true;
      gsap.set(overlay, { visibility: "visible" });
      if (reducedMotion()) tl.progress(1).pause();
      else tl.timeScale(1).play();
      document.documentElement.style.overflow = "hidden";
      lenis?.current?.stop();
      closeButtonRef.current?.focus();
      return;
    }

    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    const returnFocus = !skipFocusReturnRef.current;
    if (instantCloseRef.current || reducedMotion()) {
      tl.progress(0).pause();
      gsap.set(overlay, { visibility: "hidden" });
    } else {
      tl.timeScale(CLOSE_SPEED).reverse();
    }
    instantCloseRef.current = false;
    skipFocusReturnRef.current = false;
    document.documentElement.style.overflow = "";
    lenis?.current?.start();
    // `inert` has already dropped focus from the overlay by now.
    if (returnFocus) menuButtonRef.current?.focus({ preventScroll: true });
  }, [open, lenis]);

  // Release the scroll lock if the nav unmounts while open.
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
      lenis?.current?.start();
    },
    [lenis]
  );

  // Close instantly when the window grows into the desktop layout.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (!query.matches) return;
      instantCloseRef.current = true;
      // The MENU button is hidden on desktop, so there's nowhere to return focus.
      skipFocusReturnRef.current = true;
      setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const close = () => setOpen(false);

  // Page links go through the liquid transition: it pours over the open menu,
  // and the route change closes the menu instantly underneath the full cover.
  const goTo = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (href === pathname) {
      close();
      return;
    }
    instantCloseRef.current = true;
    navigate(href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab" || !overlayRef.current) return;
    const focusable = overlayRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const bigRow = (num: string, label: string, href: string, isPage: boolean) => {
    const content = (
      <>
        <span className={styles.mask}>
          <span className={styles.wordInner}>{label}</span>
        </span>
        <span className={styles.num}>{num}</span>
      </>
    );
    return isPage ? (
      <Link href={href} className={styles.row} onClick={goTo(href)}>
        {content}
      </Link>
    ) : (
      <a href={href} className={styles.row} onClick={close}>
        {content}
      </a>
    );
  };

  return (
    <>
      <button
        ref={menuButtonRef}
        type="button"
        className={`${styles.toggle} ${styles.menuButton}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(true)}
      >
        Menu
        <svg className={styles.icon} viewBox="0 0 18 18" aria-hidden="true">
          <path d="M0 5.5h18M0 12.5h18" />
        </svg>
      </button>

      {isClient &&
        createPortal(
          <div
            ref={overlayRef}
            id={menuId}
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            inert={!open}
            onKeyDown={onKeyDown}
          >
            <div className={styles.top}>
              <Link href="/" className={styles.initials} onClick={goTo("/")}>
                tastelife
              </Link>
              <button ref={closeButtonRef} type="button" className={styles.toggle} onClick={close}>
                Close
                <svg className={styles.icon} viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M1 1l16 16M17 1L1 17" />
                </svg>
              </button>
            </div>

            <nav className={styles.list} aria-label="Site">
              {bigRow("01", "Work", "/work", true)}
              <ul className={`${styles.sub} ${styles.fade}`}>
                {WORK_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.subLink} onClick={goTo(link.href)}>
                      {link.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {bigRow("02", "About", "/about", true)}
              {bigRow("03", "Contact", `mailto:${EMAIL}`, false)}
            </nav>

            <div className={`${styles.bottom} ${styles.fade}`}>
              <p className={styles.name}>{NAME}</p>
              <div className={styles.contact}>
                <a href={INSTAGRAM_URL} onClick={close}>
                  Instagram
                </a>
                <a href={`mailto:${EMAIL}`} onClick={close}>
                  {EMAIL}
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
