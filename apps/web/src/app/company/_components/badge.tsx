import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "../company-page.module.css";

export function Badge({
  tone,
  children,
}: {
  tone: "brand" | "muted";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        styles.badge,
        tone === "brand" ? styles.badgeBrand : styles.badgeMuted,
      )}
    >
      {children}
    </span>
  );
}
