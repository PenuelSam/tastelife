Project: fashion portfolio site for a designer who works across three disciplines: Fashion Design, Styling and Modeling. Next.js App Router + TypeScript, CSS Modules (no Tailwind), GSAP (with @gsap/react useGSAP) for motion, Lenis for smooth scroll, OGL for WebGL effects.

Brand:
- Colors: red #D9261C (main background), deep red #B81F17, maroon #6E0F14, cream #F3EADB (text, bars, frames), paper #F7EFE6 (light page sections). Define them as CSS variables in globals.css.
- Fonts via next/font/google: Anton (all display and headline type, uppercase), Pinyon Script (script accents), Archivo 400/600 (body, nav, small labels). Expose as CSS variables --font-display, --font-script, --font-body.
- Look: bold flat poster style. Heavy condensed uppercase type, thick cream bars and frames on red. No gradients, no drop shadows, no rounded cards.

Pages: / (homepage), /talent (Choose your Talent), /fashion-design, /styling, /modeling, /about.
Shared nav: initials on the left linking to /, then Work (/talent), About (/about), Contact (mailto) on the right. Archivo 600, 13px, uppercase, 0.14em letter-spacing.

Rules:
- Every animation and WebGL effect must respect prefers-reduced-motion: show the final, still state instead.
- WebGL effects need a static fallback if WebGL is unavailable, and lighter behavior on touch devices.
- Clean up every GSAP timeline, animation frame loop, event listener and WebGL context on unmount.
- Mobile-first: everything must work at 375px wide with no horizontal scroll.
- Use placeholders like [NAME], [SURNAME], [email] for content we don't have yet; never invent copy.