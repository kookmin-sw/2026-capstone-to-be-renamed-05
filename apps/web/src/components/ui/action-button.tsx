import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import styles from "./action-button.module.css";

type ActionButtonVariant = "primary" | "outline" | "subtle" | "ghost";
type ActionButtonSize = "sm" | "md" | "lg" | "icon";

type SharedActionProps = {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
};

export function actionButtonClassName({
  variant = "primary",
  size = "md",
  className,
}: SharedActionProps & { className?: string }) {
  return cn(styles.button, styles[variant], styles[size], className);
}

export function ActionButton({
  className,
  variant,
  size,
  iconStart,
  iconEnd,
  children,
  ...props
}: ComponentProps<"button"> & SharedActionProps) {
  return (
    <button
      className={actionButtonClassName({ variant, size, className })}
      {...props}
    >
      {iconStart}
      {children}
      {iconEnd}
    </button>
  );
}

export function ActionLink({
  className,
  variant,
  size,
  iconStart,
  iconEnd,
  children,
  ...props
}: ComponentProps<typeof Link> & SharedActionProps) {
  return (
    <Link className={actionButtonClassName({ variant, size, className })} {...props}>
      {iconStart}
      {children}
      {iconEnd}
    </Link>
  );
}
