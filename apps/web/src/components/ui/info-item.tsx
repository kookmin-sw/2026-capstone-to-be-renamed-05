import styles from "./info-item.module.css";

export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
}
