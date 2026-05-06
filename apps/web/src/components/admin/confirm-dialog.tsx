"use client";

import styles from "./admin.module.css";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className={styles.dialogBackdrop}>
      <div className={styles.dialog}>
        <h2 className={styles.dialogTitle}>{title}</h2>
        <p className={styles.dialogDescription}>{description}</p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.secondaryButton}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={styles.primaryButton}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
