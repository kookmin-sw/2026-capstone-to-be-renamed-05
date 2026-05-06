import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import styles from "./icon-tile.module.css";

type IconTileProps = {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "solid" | "neutral";
  className?: string;
};

export function IconTile({
  icon: Icon,
  size = "md",
  tone = "brand",
  className,
}: IconTileProps) {
  return (
    <span
      className={cn(
        styles.tile,
        styles[size],
        tone !== "brand" && styles[tone],
        className,
      )}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}
