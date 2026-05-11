import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import styles from "./breadcrumb.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  current: string;
}

export function Breadcrumb({ items, current }: BreadcrumbProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Breadcrumb">
          <Link href="/" className={styles.link}>
            <Home size={14} />
          </Link>
          {items.map((item) => (
            <span key={item.label} className={styles.segment}>
              <ChevronRight size={13} className={styles.separator} />
              {item.href ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          ))}
          <ChevronRight size={13} className={styles.separator} />
          <span className={styles.current}>{current}</span>
        </nav>
      </div>
    </div>
  );
}
