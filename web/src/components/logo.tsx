import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="ink-mark grid h-9 w-9 place-items-center rounded-xl bg-accent-fill text-sm font-bold text-on-accent transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-105">
        MI
      </span>
      <span>
        Marca<span className="text-accent">Ink</span>
      </span>
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} aria-label="Voltar para o início" className="group w-fit">
      {mark}
    </Link>
  );
}
