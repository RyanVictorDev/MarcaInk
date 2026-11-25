"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const POPOVER_WIDTH = 292;

type View = { year: number; month: number };

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
};

function toISO(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function todayISO() {
  return toISO(new Date());
}

function addDays(iso: string, days: number) {
  const date = fromISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

function formatBR(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function placePopover(rect: DOMRect, height: number) {
  let left = rect.left;
  if (left + POPOVER_WIDTH > window.innerWidth - 12) left = window.innerWidth - POPOVER_WIDTH - 12;
  if (left < 12) left = 12;
  let top = rect.bottom + 8;
  if (top + height > window.innerHeight - 12) top = Math.max(12, rect.top - height - 8);
  return { top, left };
}

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function DatePicker({ id, value, onChange, min, placeholder = "dd/mm/aaaa", className }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ year: 0, month: 0 });
  const [cursor, setCursor] = useState("");
  const [box, setBox] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const today = todayISO();

  function seedDate() {
    if (value) return value;
    if (min && min > today) return min;
    return today;
  }

  function place() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox(placePopover(rect, panelRef.current?.offsetHeight ?? 356));
  }

  function openPanel() {
    const seed = seedDate();
    const date = fromISO(seed);
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setBox(placePopover(rect, 356));
    setView({ year: date.getFullYear(), month: date.getMonth() });
    setCursor(seed);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    place();
    panelRef.current?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
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
  }, [open, view.year, view.month]);

  function choose(iso: string) {
    if (min && iso < min) return;
    onChange(iso);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function shiftMonth(delta: number) {
    const next = new Date(view.year, view.month + delta, 1);
    const iso = toISO(next);
    setView({ year: next.getFullYear(), month: next.getMonth() });
    setCursor(min && iso < min ? min : iso);
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const step = steps[event.key];
    if (step) {
      event.preventDefault();
      const next = addDays(cursor || seedDate(), step);
      if (min && next < min) return;
      const date = fromISO(next);
      setCursor(next);
      setView({ year: date.getFullYear(), month: date.getMonth() });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(cursor || seedDate());
    }
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    }
  }

  const days = monthGrid(view.year, view.month);
  const monthName = new Date(view.year, view.month, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const minMonth = min ? fromISO(min) : null;
  const atMinMonth = Boolean(minMonth && (view.year < minMonth.getFullYear() || (view.year === minMonth.getFullYear() && view.month <= minMonth.getMonth())));
  const todayBlocked = Boolean(min && today < min);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-40 items-center justify-between gap-2 rounded-xl border border-card-border bg-surface px-3 py-2 text-left text-sm transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
          open && "border-accent/60 ring-2 ring-accent/20",
          value ? "text-foreground" : "text-muted"
        )}
        onClick={() => (open ? setOpen(false) : openPanel())}
      >
        <span>{value ? formatBR(value) : placeholder}</span>
        <Calendar className={cn("h-4 w-4 shrink-0", open ? "text-accent" : "text-muted")} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Escolher data"
            tabIndex={-1}
            style={{ top: box.top, left: box.left, width: POPOVER_WIDTH }}
            className="fixed z-[80] rounded-2xl border border-card-border bg-menu p-3 shadow-[0_22px_50px_-20px_var(--shadow)] outline-none"
            onKeyDown={onPanelKeyDown}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                aria-label="Mês anterior"
                disabled={atMinMonth}
                className="rounded-lg p-1.5 text-muted transition hover:bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium text-foreground">{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</p>
              <button
                type="button"
                aria-label="Próximo mês"
                className="rounded-lg p-1.5 text-muted transition hover:bg-hover hover:text-foreground"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium tracking-wide text-muted">
              {WEEKDAYS.map((label, index) => (
                <span key={`${label}-${index}`} className="py-1">
                  {label}
                </span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7">
              {days.map((date) => {
                const iso = toISO(date);
                const inMonth = date.getMonth() === view.month;
                const selected = iso === value;
                const isToday = iso === today;
                const blocked = Boolean(min && iso < min);
                const focused = iso === cursor;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={blocked}
                    aria-label={date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    aria-pressed={selected}
                    className={cn(
                      "mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm transition",
                      selected && "bg-accent-fill font-medium text-on-accent",
                      !selected && inMonth && "text-foreground",
                      !selected && !inMonth && "text-muted",
                      !selected && isToday && "font-medium text-accent",
                      focused && !selected && "bg-hover",
                      !selected && !blocked && "hover:bg-hover",
                      blocked && "pointer-events-none opacity-25"
                    )}
                    onMouseEnter={() => setCursor(iso)}
                    onClick={() => choose(iso)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-card-border px-1 pt-2">
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm text-muted transition hover:bg-hover hover:text-foreground"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                Limpar
              </button>
              <button
                type="button"
                disabled={todayBlocked}
                className="rounded-lg px-2 py-1 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-30"
                onClick={() => choose(today)}
              >
                Hoje
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
