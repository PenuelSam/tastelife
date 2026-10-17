import Image from "next/image";
import type { LaneItem } from "@/data/lanes";
import TileVideo from "./TileVideo";
import styles from "./LanePage.module.css";

type Variant = "grid" | "thumb";

const SIZES: Record<Variant, string> = {
  grid: "(max-width: 767px) 60vw, 420px",
  thumb: "60px",
};

/** The comp card drawn as a white card with a red border. */
export function CompCard({ large = false }: { large?: boolean }) {
  return (
    <span className={`${styles.compCard} ${large ? styles.compCardLarge : ""}`}>
      <span className={styles.compCardTitle}>
        Comp
        <br />
        card
      </span>
      <span className={styles.compCardStats}>Height · Bust · Waist · Hips</span>
    </span>
  );
}

/** Media that fills its (aspect-ratio) box: image, video poster, card or placeholder. */
export default function LaneMedia({ item, variant, eager = false }: { item: LaneItem; variant: Variant; eager?: boolean }) {
  if (item.kind === "card") return variant === "thumb" ? <span className={styles.thumbCard}>CC</span> : <CompCard />;

  if (!item.src) {
    return (
      <span className={styles.placeholder}>{variant === "grid" && <span className={styles.placeholderLabel}>{item.title}</span>}</span>
    );
  }

  if (item.kind === "video") {
    if (variant === "grid") return <TileVideo item={item} />;
    return item.poster ? <Image className={styles.fill} src={item.poster} alt="" fill sizes={SIZES.thumb} /> : null;
  }

  return (
    <Image
      className={styles.fill}
      src={item.src}
      alt={variant === "grid" ? item.alt : ""}
      fill
      sizes={SIZES[variant]}
      loading={eager ? "eager" : "lazy"}
    />
  );
}
