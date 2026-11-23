"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Common = {
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, id, className, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn(error && "field-error")}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm text-muted">
        {label}
      </label>
      <Input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(error && "border-red-400/80 focus:border-red-400 focus:ring-red-400/25", className)}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = useId();
  const fieldId = id ?? generated;
  const messageId = `${fieldId}-message`;

  return (
    <div className={cn(error && "field-error")}>
      <label htmlFor={fieldId} className="mb-1.5 block text-sm text-muted">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={cn(
          "min-h-28 w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20",
          error && "border-red-400/80 focus:border-red-400 focus:ring-red-400/25",
          className
        )}
        {...props}
      />
      <FieldMessage id={messageId} error={error} hint={hint} />
    </div>
  );
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-xs text-muted">
        {hint}
      </p>
    );
  }
  return null;
}
