"use client";

import { Clock } from "lucide-react";
import { KeyboardEvent, RefObject, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const QUICK_MINUTES = ["00", "15", "30", "45"];
const PANEL_WIDTH = 252;
const PANEL_HEIGHT = 372;

type ColumnName = "hour" | "minute";

type Props = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  kicker?: string;
  className?: string;
};

function splitTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  const hour = Math.min(23, Math.max(0, Number(match?.[1] ?? 0)));
  const minute = Math.min(59, Math.max(0, Number(match?.[2] ?? 0)));
  return {
    hour: String(hour).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
  };
}

function place(rect: DOMRect) {
  let left = rect.left;
  if (left + PANEL_WIDTH > window.innerWidth - 12) left = Math.max(12, window.innerWidth - PANEL_WIDTH - 12);
  let top = rect.bottom + 8;
  if (top + PANEL_HEIGHT > window.innerHeight - 12) top = Math.max(12, rect.top - PANEL_HEIGHT - 8);
  return { top, left };
}

function centerSelected(list: HTMLDivElement | null) {
  const node = list?.querySelector<HTMLElement>("[aria-selected='true']");
  if (!list || !node) return;
  list.scrollTop = node.offsetTop - list.clientHeight / 2 + node.offsetHeight / 2;
}

function Column({
  label,
  values,
  selected,
  active,
  listRef,
  onPick,
}: {
  label: string;
  values: string[];
  selected: string;
  active: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  onPick: (value: string) => void;
}) {
  return (
    <div className={cn("min-w-0 rounded-xl px-1 pt-1", active && "ring-1 ring-accent/35")}>
      <p className={cn("pb-1 text-center text-[10px] font-medium tracking-[0.22em]", active ? "text-accent" : "text-muted")}>{label}</p>
      <div className="relative h-44">
        <div
          ref={listRef}
          role="listbox"
          aria-label={label}
          className="time-drum h-full overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col gap-0.5 px-1 py-1">
            {values.map((item) => {
              const chosen = item === selected;
              return (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={chosen}
                  className={cn(
                    "flex h-9 shrink-0 items-center justify-center rounded-lg text-sm tabular-nums transition",
                    chosen
                      ? "bg-accent-fill font-semibold text-on-accent shadow-[0_10px_22px_-14px_var(--accent)]"
                      : "text-muted hover:bg-hover hover:text-foreground"
                  )}
                  onClick={() => onPick(item)}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-menu to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-menu to-transparent" />
      </div>
    </div>
  );
}

export function TimePicker({ value, onChange, ariaLabel, kicker = "Horário", className }: Props) {
  const [open, setOpen] = useState(false);
  const [column, setColumn] = useState<ColumnName>("hour");
  const [box, setBox] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const typed = useRef("");
  const typedTimer = useRef(0);
  const panelId = useId();
  const { hour, minute } = splitTime(value);

  function commit(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`);
  }

  function bump(part: ColumnName, delta: number) {
    if (part === "hour") {
      const next = (Number(hour) + delta + 24) % 24;
      commit(String(next).padStart(2, "0"), minute);
      return;
    }
    const next = (Number(minute) + delta + 60) % 60;
    commit(hour, String(next).padStart(2, "0"));
  }

  function placePanel() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBox(place(rect));
  }

  useEffect(() => {
    if (!open) return;
    placePanel();
    const frame = requestAnimationFrame(() => {
      centerSelected(hourRef.current);
      centerSelected(minuteRef.current);
    });
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = (event: Event) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      placePanel();
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", placePanel);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, value]);

  function typeDigit(digit: string) {
    window.clearTimeout(typedTimer.current);
    const buffer = (typed.current + digit).slice(-2);
    typed.current = buffer.length >= 2 ? "" : buffer;
    const number = Number(buffer);
    if (column === "hour") commit(String(Math.min(23, number)).padStart(2, "0"), minute);
    else commit(hour, String(Math.min(59, number)).padStart(2, "0"));
    typedTimer.current = window.setTimeout(() => {
      typed.current = "";
    }, 700);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        placePanel();
        setOpen(true);
        return;
      }
      bump(column, event.key === "ArrowDown" ? 1 : -1);
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && open) {
      event.preventDefault();
      setColumn(event.key === "ArrowLeft" ? "hour" : "minute");
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) placePanel();
      setOpen((current) => !current);
    }
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
    if (open && /^\d$/.test(event.key)) {
      event.preventDefault();
      typeDigit(event.key);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex items-center gap-1.5 rounded-xl border border-card-border bg-surface px-3 py-2 text-sm tabular-nums transition focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
          open && "border-accent/60 ring-2 ring-accent/20"
        )}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          setColumn("hour");
          placePanel();
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      >
        <span className="font-medium text-foreground">{hour}</span>
        <span className={cn("font-semibold", open ? "text-accent" : "text-accent/80")}>:</span>
        <span className="font-medium text-foreground">{minute}</span>
        <Clock className={cn("ml-1 h-3.5 w-3.5", open ? "text-accent" : "text-muted")} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={ariaLabel}
            style={{ top: box.top, left: box.left, width: PANEL_WIDTH }}
            className="fixed z-[80] overflow-hidden rounded-2xl border border-card-border bg-menu shadow-[0_22px_50px_-20px_var(--shadow)]"
          >
            <div className="flex items-end justify-between border-b border-card-border px-4 py-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.22em] text-muted">{kicker.toUpperCase()}</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {hour}
                  <span className="text-accent">:</span>
                  {minute}
                </p>
              </div>
              <Clock className="mb-1 h-4 w-4 text-accent" />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 p-2">
              <Column
                label="HORA"
                values={HOURS}
                selected={hour}
                active={column === "hour"}
                listRef={hourRef}
                onPick={(next) => {
                  setColumn("hour");
                  commit(next, minute);
                }}
              />
              <div className="my-8 w-px bg-card-border" />
              <Column
                label="MIN"
                values={MINUTES}
                selected={minute}
                active={column === "minute"}
                listRef={minuteRef}
                onPick={(next) => {
                  setColumn("minute");
                  commit(hour, next);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-card-border px-3 py-2">
              <span className="text-[10px] font-medium tracking-[0.16em] text-muted">ATALHO</span>
              <div className="flex gap-1">
                {QUICK_MINUTES.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    className={cn(
                      "rounded-md px-1.5 py-1 text-xs tabular-nums transition",
                      minute === mark ? "bg-accent-fill font-medium text-on-accent" : "text-muted hover:bg-hover hover:text-foreground"
                    )}
                    onClick={() => {
                      setColumn("minute");
                      commit(hour, mark);
                    }}
                  >
                    :{mark}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
