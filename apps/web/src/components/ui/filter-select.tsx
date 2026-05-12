"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import styles from "./filter-select.module.css";

type Option = { label: string; value: string };

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  className,
  hideLabel = false,
  ariaLabel,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hideLabel?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn(styles.wrap, className)}>
      <p className={cn(styles.label, hideLabel && styles.visuallyHidden)}>
        {label}
      </p>
      <button
        type="button"
        className={styles.selectButton}
        aria-label={ariaLabel ?? label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.selectValue}>{selected?.label ?? ""}</span>
        <ChevronDown
          size={14}
          className={cn(styles.chevron, open && styles.chevronOpen)}
        />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className={styles.optionList}
          tabIndex={-1}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(styles.option, active && styles.optionSelected)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FilterInput({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  min,
  className,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  min?: number;
  className?: string;
}) {
  return (
    <div className={cn(styles.wrap, className)}>
      <p className={styles.label}>{label}</p>
      <input
        className={styles.input}
        type={type}
        min={min}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
