"use client";

import { ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousBody = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const mains = Array.from(document.querySelectorAll("main"));
    const previousMains = mains.map((node) => node.style.overflow);
    mains.forEach((node) => {
      node.style.overflow = "hidden";
    });
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousBody;
      mains.forEach((node, index) => {
        node.style.overflow = previousMains[index];
      });
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="stencil-in relative z-10 max-h-[min(92dvh,100%)] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-card-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_30px_80px_-40px_var(--shadow)] sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Fechar"
            className="rounded-lg px-2 py-1 text-muted transition hover:bg-hover hover:text-foreground"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
