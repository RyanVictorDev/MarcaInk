"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { cn, formatDateTime } from "@/lib/utils";

type Alert = {
  id: number;
  read: boolean;
  customer_name: string;
  service_name: string;
  artist_name: string;
  for_you: boolean;
  starts_at: string;
};

type Payload = { unread_count: number; notifications: Alert[] };

type AlertsState = {
  unread: number;
  open: boolean;
  panelId: string;
  toggle: (anchor: HTMLButtonElement) => void;
};

const AlertsContext = createContext<AlertsState | null>(null);
const PANEL_HEIGHT = 420;

function place(rect: DOMRect) {
  const width = Math.min(340, window.innerWidth - 24);
  let left = rect.right - width;
  if (left < 12) left = 12;
  let top = rect.bottom + 8;
  if (top + PANEL_HEIGHT > window.innerHeight - 12) top = Math.max(12, rect.top - PANEL_HEIGHT - 8);
  return { top, left, width };
}

export function BookingAlertsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState({ top: 0, left: 0, width: 320 });
  const primed = useRef(false);
  const seenId = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    let stop = false;

    async function load() {
      const token = getToken();
      if (!token || document.hidden) return;
      try {
        const data = await api<Payload>("/api/v1/notifications", { token });
        if (stop) return;
        const newest = data.notifications[0]?.id ?? 0;
        const fresh = data.notifications.filter((item) => !item.read && item.id > seenId.current);
        if (primed.current && fresh.length > 0) {
          const latest = fresh[0];
          const when = formatDateTime(latest.starts_at);
          const detail = latest.for_you ? `${latest.service_name} · ${when}` : `${latest.service_name} com ${latest.artist_name} · ${when}`;
          toast.success(`${latest.customer_name} marcou um horário`, fresh.length > 1 ? `${detail} · +${fresh.length - 1}` : detail);
          window.dispatchEvent(new Event("marcaink:bookings-changed"));
        }
        seenId.current = Math.max(seenId.current, newest);
        primed.current = true;
        setItems(data.notifications);
        setUnread(data.unread_count);
      } catch {
        primed.current = true;
      }
    }

    load();
    const timer = window.setInterval(load, 15000);
    document.addEventListener("visibilitychange", load);
    window.addEventListener("focus", load);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
      window.removeEventListener("focus", load);
    };
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest?.("[data-alerts-trigger]") || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function mark(id: number) {
    const token = getToken();
    if (!token) return;
    const data = await api<{ unread_count: number }>(`/api/v1/notifications/${id}/read`, { method: "POST", token });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnread(data.unread_count);
  }

  async function markAll() {
    const token = getToken();
    if (!token || unread === 0) return;
    try {
      await api("/api/v1/notifications/read_all", { method: "POST", token });
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível marcar como lidas.");
    }
  }

  function openItem(item: Alert) {
    setOpen(false);
    if (!item.read) mark(item.id).catch(() => undefined);
    router.push("/app/agenda");
  }

  const state: AlertsState = {
    unread,
    open,
    panelId,
    toggle: (anchor) => {
      setBox(place(anchor.getBoundingClientRect()));
      setOpen((current) => !current);
    },
  };

  return (
    <AlertsContext.Provider value={state}>
      {children}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            data-alerts-panel
            role="dialog"
            aria-label="Marcações novas"
            style={{ top: box.top, left: box.left, width: box.width }}
            className="fixed z-[80] overflow-hidden rounded-2xl border border-card-border bg-menu shadow-[0_22px_50px_-20px_var(--shadow)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-card-border px-4 py-3">
              <p className="text-sm font-medium">Marcações</p>
              <button
                type="button"
                className="text-xs text-muted transition hover:text-accent disabled:opacity-40"
                disabled={unread === 0}
                onClick={markAll}
              >
                Marcar como lidas
              </button>
            </div>
            <div className="time-drum max-h-80 overflow-y-auto p-2">
              {items.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">Quando um cliente marcar, aparece aqui.</p>}
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-hover",
                    !item.read && "bg-accent/10"
                  )}
                  onClick={() => openItem(item)}
                >
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-accent-fill")} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{item.customer_name} marcou</span>
                    <span className="block truncate text-xs text-muted">
                      {item.service_name}
                      {item.for_you ? "" : ` · ${item.artist_name}`}
                    </span>
                    <span className="block text-xs text-accent">{formatDateTime(item.starts_at)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </AlertsContext.Provider>
  );
}

export function BookingAlertsButton() {
  const alerts = useContext(AlertsContext);
  if (!alerts) return null;
  const label = alerts.unread > 0 ? `Marcações, ${alerts.unread} sem ler` : "Marcações";

  return (
    <button
      type="button"
      data-alerts-trigger
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={alerts.open}
      aria-controls={alerts.open ? alerts.panelId : undefined}
      className={cn(
        "relative rounded-xl border border-card-border bg-surface p-2 text-muted transition hover:text-foreground",
        alerts.open && "border-accent/60 text-accent ring-2 ring-accent/20"
      )}
      onClick={(event) => alerts.toggle(event.currentTarget)}
    >
      <Bell className="h-4 w-4" />
      {alerts.unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-fill px-1 text-[10px] font-semibold text-on-accent">
          {alerts.unread > 9 ? "9+" : alerts.unread}
        </span>
      )}
    </button>
  );
}
