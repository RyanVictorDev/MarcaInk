import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

function buttonClass(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50",
    size === "sm" && "px-3 py-1.5 text-sm",
    size === "md" && "px-4 py-2.5 text-sm",
    size === "lg" && "px-6 py-3 text-base",
    variant === "primary" && "ink-sheen bg-accent-fill text-on-accent hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_12px_30px_-16px_var(--accent-fill)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-fill)_50%,transparent)]",
    variant === "ghost" && "text-foreground hover:-translate-y-0.5 hover:bg-hover",
    variant === "outline" && "border border-card-border bg-card hover:-translate-y-0.5 hover:border-accent/70 hover:shadow-[0_12px_30px_-18px_var(--accent)]",
    className
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  href?: string;
  children?: ReactNode;
};

export function Button({ className, variant = "primary", size = "md", href, children, ...props }: Props) {
  const classes = buttonClass(variant, size, className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}