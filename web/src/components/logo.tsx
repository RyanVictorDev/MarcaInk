import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-sm font-bold text-black">MI</span>
      <span>
        Marca<span className="text-accent">Ink</span>
      </span>
    </div>
  );
}