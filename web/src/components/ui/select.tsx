"use client";

import { Check, ChevronDown } from "lucide-react";
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type Props = {
  id?: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
};

export function Select({ id, value, options, onChange, invalid, placeholder = "Selecione" }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [box, setBox] = useState({ top: 0, left: 0, width: 0 });
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBox({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    place();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, selectedIndex]);

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox({ top: rect.bottom + 8, left: rect.left, width: rect.width });
  }

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        place();
        setOpen(true);
        return;
      }
      setActiveIndex((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (current + delta + options.length) % options.length;
      });
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        place();
        setOpen(true);
      } else choose(options[activeIndex]?.value ?? value);
    }
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", open && "z-20")}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-card-border bg-surface px-4 py-2.5 text-left text-sm text-foreground transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
          open && "border-accent/60 ring-2 ring-accent/20",
          invalid && "border-red-400/80 focus:border-red-400 focus:ring-red-400/25"
        )}
        onClick={() => {
          place();
          setOpen((current) => !current);
        }}
        onKeyDown={onKeyDown}
      >
        <span className={cn("min-w-0 truncate", !selected && "text-muted")}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition duration-200", open && "rotate-180 text-accent")} />
      </button>
      {open &&
        box.width > 0 &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            style={{ top: box.top, left: box.left, width: box.width }}
            className="fixed z-[100] overflow-hidden rounded-xl border border-card-border bg-menu p-1 shadow-[0_22px_50px_-20px_var(--shadow)]"
          >
            {options.map((option, index) => {
              const chosen = option.value === value;
              const active = index === activeIndex;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={chosen}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                      chosen ? "bg-accent/15 text-accent" : "text-foreground",
                      active && !chosen && "bg-hover",
                      !chosen && "hover:bg-hover"
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option.value)}
                  >
                    {option.label}
                    {chosen && <Check className="h-4 w-4" />}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
