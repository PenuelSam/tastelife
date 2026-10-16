import Link from "next/link";
import MobileMenu from "./MobileMenu";
import styles from "./Nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav} aria-label="Main" data-site-nav>
      <Link href="/" className={styles.initials}>
        tastelife
      </Link>
      <ul className={styles.links}>
        <li>
          <Link href="/talent">Work</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <a href="mailto:[email]">Contact</a>
        </li>
      </ul>
      <MobileMenu />
    </nav>
  );
}
