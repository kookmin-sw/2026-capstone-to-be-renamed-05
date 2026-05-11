import { cn } from "@/lib/utils";
import styles from "../job-detail.module.css";

interface ChipGroupProps {
  title: string;
  items: string[];
  tone: "pink" | "gray";
}

export function ChipGroup({ title, items, tone }: ChipGroupProps) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className={cn("mb-1.5 text-xs font-bold", tone === "pink" && styles.brandText)}>
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={
              tone === "pink"
                ? styles.chipBrand
                : styles.chipGray
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
