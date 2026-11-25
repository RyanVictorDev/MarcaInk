"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, CreditCard, LayoutDashboard, LogOut, Scissors, Settings, Users } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { BookingAlertsButton, BookingAlertsProvider } from "@/components/booking-alerts";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { clearToken } from "@/lib/auth-store";
import { allowedHrefs, roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useStaff } from "@/components/staff-context";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/tatuadores", label: "Tatuadores", icon: Users },
  { href: "/app/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/app/config", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { studio, role } = useStaff();
  const visible = links.filter((link) => allowedHrefs(role).includes(link.href));
  const allowed = allowedHrefs(role).includes(pathname);

  useEffect(() => {
    if (!allowed) router.replace("/app");
  }, [allowed, router]);

  return (
    <ToastProvider>
    <BookingAlertsProvider>
    <div className="flex h-dvh gap-4 overflow-hidden p-3 sm:p-4">
      <aside className="hidden h-full w-64 shrink-0 flex-col rounded-2xl border border-card-border bg-card/60 p-4 md:flex">
        <Logo />
        {studio && (
          <p className="mt-4 rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted">
            {studio.name}
            <br />
            <span className="text-foreground">/s/{studio.slug}</span>
            <br />
            <span className="text-accent">{roleLabel(role)}</span>
          </p>
        )}
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {visible.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                pathname === href ? "bg-accent/15 text-accent" : "text-muted hover:bg-hover hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => {
              clearToken();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
          <ThemeToggle />
        </div>
      </aside>
      <div className="app-scroll flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MobileNav links={visible} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
          {allowed && (
            <div className="mb-4 hidden justify-end md:flex">
              <BookingAlertsButton />
            </div>
          )}
          {allowed ? children : null}
        </main>
      </div>
    </div>
    </BookingAlertsProvider>
    </ToastProvider>
  );
}