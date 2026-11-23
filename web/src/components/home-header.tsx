"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  { id: "features", label: "Recursos" },
  { id: "pricing", label: "Planos" },
];

function scrollToSection(id: string) {
  const node = id ? document.getElementById(id) : null;
  if (node) {
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function HomeHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onPop = () => scrollToSection(window.location.hash.replace("#", ""));
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function goTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const nextUrl = `${window.location.pathname}#${id}`;
    window.history.pushState({ section: id }, "", nextUrl);
    scrollToSection(id);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 mb-12 transition-colors duration-300",
        scrolled && "border-b border-card-border bg-header backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm md:flex">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="nav-ink" onClick={(event) => goTo(event, section.id)}>
              {section.label}
            </a>
          ))}
          <Link href="/s/black-needle" className="nav-ink">
            Demo pública
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href="/login" variant="ghost">
            Entrar
          </Button>
          <Button href="/register">Começar grátis</Button>
        </div>
      </div>
    </header>
  );
}
