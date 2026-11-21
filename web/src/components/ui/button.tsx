import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" && "bg-accent text-black hover:bg-amber-400 shadow-[0_0_0_1px_#fbbf2480]",
        variant === "ghost" && "text-foreground hover:bg-white/5",
        variant === "outline" && "border border-card-border bg-card hover:border-accent/50",
        className
      )}
      {...props}
    />
  );
}