"use client";

import { AlertCircle, Check, X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error";

type Toast = {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
};

type ToastApi = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);
const LIFE_MS = 4200;

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast precisa estar dentro do painel.");
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const pushRef = useRef<(tone: Tone, title: string, description?: string) => void>(() => {});

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((tone: Tone, title: string, description?: string) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current.slice(-3), { id, tone, title, description }]);
  }, []);

  pushRef.current = push;

  const api = useRef<ToastApi>({
    success: (title, description) => pushRef.current("success", title, description),
    error: (title, description) => pushRef.current("error", title, description),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-3 z-[90] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 md:bottom-6 md:right-6">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const timer = useRef<number | null>(null);
  const remaining = useRef(LIFE_MS);
  const started = useRef(0);
  const barRef = useRef<HTMLSpanElement>(null);
  const success = toast.tone === "success";

  function clearTimer() {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }

  function arm(ms: number) {
    clearTimer();
    started.current = Date.now();
    timer.current = window.setTimeout(onClose, ms);
  }

  useEffect(() => {
    arm(LIFE_MS);
    return clearTimer;
  }, []);

  return (
    <div
      role={success ? "status" : "alert"}
      className="toast-in pointer-events-auto relative overflow-hidden rounded-2xl border border-card-border bg-menu shadow-[0_22px_50px_-24px_var(--shadow)]"
      onMouseEnter={() => {
        remaining.current = Math.max(0, remaining.current - (Date.now() - started.current));
        clearTimer();
        if (barRef.current) barRef.current.style.animationPlayState = "paused";
      }}
      onMouseLeave={() => {
        arm(Math.max(remaining.current, 700));
        if (barRef.current) barRef.current.style.animationPlayState = "running";
      }}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            success ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
          )}
        >
          {success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm font-medium text-foreground">{toast.title}</p>
          {toast.description ? <p className="mt-0.5 text-sm text-muted">{toast.description}</p> : null}
        </div>
        <button
          type="button"
          aria-label="Fechar notificação"
          className="rounded-lg p-1 text-muted transition hover:bg-hover hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <span ref={barRef} className={cn("toast-life absolute inset-x-0 bottom-0 h-0.5", success ? "bg-success" : "bg-danger")} />
    </div>
  );
}
