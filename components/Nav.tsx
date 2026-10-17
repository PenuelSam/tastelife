import MobileMenu from "./MobileMenu";
import { TransitionLink } from "./PageTransition";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav} aria-label="Main" data-site-nav>
      <TransitionLink href="/" className={styles.initials}>
        tastelife
      </TransitionLink>
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
