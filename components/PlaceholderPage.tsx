import styles from "./PlaceholderPage.module.css";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.note}>[Content coming soon]</p>
    </main>
  );
}
