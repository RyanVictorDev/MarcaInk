"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, CreditCard, LayoutDashboard, LogOut, Scissors, Settings } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { api, Studio } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/agenda", label: "Agenda", icon: Calendar },
  { href: "/app/servicos", label: "Serviços", icon: Scissors },
  { href: "/app/assinatura", label: "Assinatura", icon: CreditCard },
  { href: "/app/config", label: "Configurações", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [studio, setStudio] = useState<Studio | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api<{ studio: Studio }>("/api/v1/auth/me", { token }).then((r) => setStudio(r.studio)).catch(() => {
      clearToken();
      router.replace("/login");
    });
  }, [router]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 lg:px-8">
      <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-card-border bg-card/60 p-4 md:flex">
        <Logo />
        {studio && (
          <p className="mt-4 rounded-xl bg-black/40 px-3 py-2 text-xs text-muted">
            {studio.name}
            <br />
            <span className="text-foreground">/s/{studio.slug}</span>
          </p>
        )}
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                pathname === href ? "bg-accent/15 text-accent" : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
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
      </aside>
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <MobileNav />
        <main>{children}</main>
      </div>
    </div>
  );
}