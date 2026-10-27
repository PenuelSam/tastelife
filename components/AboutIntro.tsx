"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function AboutIntro({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const main = ref.current;
      if (!main) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        main.removeAttribute("data-about-intro");
        return;
      }

      const q = gsap.utils.selector(main);
      const nav = q("nav")[0];
      const title = q("[data-intro='title']");
      const cutout = q("[data-intro='cutout']");
      const script = q("[data-intro='script']");
      const name = q("[data-intro='name']");
      const text = q("[data-intro='text']");
      const buttons = q("[data-intro='button']");
      const hidden = "inset(0% 0% 100% 0%)";
      const shown = "inset(0% 0% 0% 0%)";

      gsap.set(title, { clipPath: hidden, y: 60 });
      gsap.set(cutout, { clipPath: "inset(100% 0% 0% 0%)", y: 80, scale: 1.06, transformOrigin: "50% 100%" });
      gsap.set(script, { opacity: 0, letterSpacing: "0.3em" });
      gsap.set(name, { clipPath: hidden, yPercent: 40 });
      gsap.set(text, { opacity: 0, y: 20 });
      gsap.set(buttons, { clipPath: "inset(0% 100% 0% 0%)" });
      if (nav) gsap.set(nav, { autoAlpha: 0, y: -16 });
      main.removeAttribute("data-about-intro");

      gsap
        .timeline()
        .to(title, { clipPath: shown, y: 0, duration: 1.1, ease: "power4.out" }, 0.1)
        .to(cutout, { clipPath: "inset(0% 0% 0% 0%)", y: 0, scale: 1, duration: 1.4, ease: "power4.out" }, 0.45)
        .to(script, { opacity: 1, letterSpacing: "0em", duration: 1, ease: "power3.out" }, 0.8)
        .to(name, { clipPath: shown, yPercent: 0, duration: 0.9, ease: "power4.out" }, 0.95)
        .to(text, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.08 }, 1.25)
        .to(buttons, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "expo.inOut", stagger: 0.1 }, 1.6)
        .to(nav ?? {}, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.9)
        .set([title, cutout, script, name, text, buttons], { clearProps: "clipPath,transform,opacity,letterSpacing" });
    },
    { scope: ref }
  );

  return (
    <main ref={ref} className={className} data-theme="paper" data-about-intro>
      {children}
    </main>
  );
}
