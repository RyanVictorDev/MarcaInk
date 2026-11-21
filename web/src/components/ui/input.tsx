import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-card-border bg-[#0d0d0d] px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
        className
      )}
      {...props}
    />
  );
}