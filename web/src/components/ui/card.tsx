import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-card-border bg-card/90 p-6 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}