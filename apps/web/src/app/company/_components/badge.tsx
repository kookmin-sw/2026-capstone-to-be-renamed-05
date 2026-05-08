import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "../company-page.module.css";

type BadgeTone = "brand" | "muted" | "success" | "danger" | "pending";

const toneClass: Record<BadgeTone, string> = {
  brand: styles.badgeBrand,
  muted: styles.badgeMuted,
  success: styles.badgeSuccess,
  danger: styles.badgeDanger,
  pending: styles.badgePending,
};

export function Badge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span className={cn(styles.badge, toneClass[tone])}>{children}</span>
  );
}
