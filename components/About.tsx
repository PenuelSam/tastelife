import { existsSync } from "node:fs";
import path from "node:path";
import AboutBio from "./AboutBio";
import AboutCutout from "./AboutCutout";
import FitText from "./FitText";
import LaneNav from "./LaneNav";
import styles from "./About.module.css";

const EMAIL = "tastelifeis@gmail.com";
const INSTAGRAM_URL = "https://www.instagram.com/tastelifeis._/";
const BIO = [
  "I’m Taiwo Adeoshun, creatively known as Tastelife, a name I’ve made my own, inspired by Taiwo, a name traditionally given to the first-born twin in Yoruba culture.",
  "I’m a fashion designer, stylist, and model, working across all three disciplines to explore fashion as a form of identity, visual expression, and storytelling. I’m interested in the relationship between what we wear, how we present ourselves, and the worlds we can create through fashion.",
  "I’m young, ambitious, hardworking, and deeply curious. I approach every opportunity with the intention to create, contribute, learn, and evolve. I’m not interested in staying within one definition of what I can do. I want to keep expanding my creative language and discovering where it can take me.",
  "Whether I’m designing a piece, creating a look, or stepping in front of the camera, I want to bring a perspective that feels distinct, intentional, and memorable.",
];

const AVAILABLE_FOR = [
  "Fashion Design",
  "Styling",
  "Modeling",
  "Editorials",
  "Campaigns",
  "Creative Direction",
  "Creative Collaborations",
];

// Drop a transparent PNG here to replace the placeholder silhouette.
const CUTOUT_SRC = "/about-cutout.png";

export default function About() {
  // Only request the cutout once the file exists, so there's no 404 until then.
  const hasCutout = existsSync(path.join(process.cwd(), "public", CUTOUT_SRC));

  return (
    <main className={styles.frame} data-theme="paper">
      <div className={styles.panel}>
        <LaneNav left="home" className={styles.nav} />

        <div className={styles.grid}>
          <div className={styles.left}>
            <h1 className={styles.title}>
              <span className={styles.titleText}>About me</span>
              {/* Mobile: the same words measured to span the panel exactly. */}
              <FitText text="ABOUT ME" className={styles.titleFit} />
            </h1>
            <AboutCutout src={hasCutout ? CUTOUT_SRC : null} alt="Taiwo Adeoshun" />
          </div>

          <div className={styles.right}>
            <h2 className={styles.name}>
              <span className={styles.firstName}>Featuring</span>{" "}
              <span className={styles.surname}>Tastelife</span>
            </h2>
            <AboutBio paragraphs={BIO} />
            <p className={styles.expertiseLabel}>Available for:</p>
            <ul className={styles.expertise}>
              {AVAILABLE_FOR.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className={styles.buttons}>
              <a className={`${styles.button} ${styles.solid}`} href={`mailto:${EMAIL}`}>
                Get in touch
              </a>
              <a className={`${styles.button} ${styles.outline}`} href={INSTAGRAM_URL}>
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
