"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "marcaink-theme";

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  root.style.colorScheme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* preferência fica só nesta aba */
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Alternar tema claro e escuro"
      onClick={toggleTheme}
      className={cn("theme-switch", className)}
    >
      <span className="theme-switch-knob" aria-hidden />
      <Sun className="theme-switch-icon theme-switch-sun" strokeWidth={2.25} />
      <Moon className="theme-switch-icon theme-switch-moon" strokeWidth={2.25} />
    </button>
  );
}
