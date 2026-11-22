"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CreditCard, LayoutDashboard, Menu, Scissors, Settings, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Início", icon: LayoutDashboard },
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/assinatura", label: "Plano", icon: CreditCard },
  { href: "/app/config", label: "Config", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
  <>
    <header className="sticky top-0 z-40 mb-4 flex items-center justify-between rounded-2xl border border-card-border bg-card/90 p-3 backdrop-blur md:hidden">
      <Logo className="text-base" />
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="rounded-lg border border-card-border p-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </header>

    {open && (
      <nav className="fixed inset-0 z-50 flex flex-col gap-2 bg-background/95 p-6 md:hidden">
        <div className="mb-4 flex items-center justify-between">
          <Logo />
          <button type="button" aria-label="Fechar" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-base",
              pathname === href ? "bg-accent/15 text-accent" : "text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    )}

    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-card-border bg-card/95 px-2 py-2 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px]",
                pathname === href ? "text-accent" : "text-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </>
  );
}