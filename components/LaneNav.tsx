import MobileMenu from "./MobileMenu";
import { TransitionLink } from "./PageTransition";
import styles from "./LaneNav.module.css";

type Props = {
  /** "back" shows ← All work / ← Work; "home" shows the initials. */
  left?: "back" | "home";
  className?: string;
};

/** In-page nav for pages that draw their own header (lane pages, About). Inherits text color. */
export default function LaneNav({ left = "back", className }: Props) {
  return (
    <nav className={className ? `${styles.nav} ${className}` : styles.nav} aria-label="Main">
      {left === "back" ? (
        <TransitionLink href="/work" className={styles.left}>
          <span className={styles.backLong}>← All work</span>
          <span className={styles.backShort}>← Work</span>
        </TransitionLink>
      ) : (
        <TransitionLink href="/" className={styles.left}>
          tastelife
        </TransitionLink>
      )}
      <ul className={styles.links}>
        <li>
          <TransitionLink href="/work">Work</TransitionLink>
        </li>
        <li>
          <TransitionLink href="/about">About</TransitionLink>
        </li>
      </ul>
      <MobileMenu />
    </nav>
  );
}
