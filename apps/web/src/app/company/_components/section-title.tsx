import type { ReactNode } from "react";
import styles from "../company-page.module.css";

export function SectionTitle({
  icon,
  title,
  aside,
}: {
  icon: ReactNode;
  title: string;
  aside: string;
}) {
  return (
    <div className={styles.sectionTitle}>
      <h2 className={styles.sectionHeading}>
        {icon}
        {title}
      </h2>
      <span className={styles.sectionCount}>{aside}</span>
    </div>
  );
}
