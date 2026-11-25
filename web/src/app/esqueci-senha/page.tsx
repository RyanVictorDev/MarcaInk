"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { api } from "@/lib/api";
import { roleLabel } from "@/lib/roles";
import { validateEmail } from "@/lib/validators";

type PreviewLink = { name: string; role: string; url: string };
type ForgotResponse = { message: string; preview?: PreviewLink[] };

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<ForgotResponse | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setLoading(true);
    try {
      const data = await api<ForgotResponse>("/api/v1/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setDone(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar agora.");
    } finally {
      setLoading(false);
    }
  }

  const preview = done?.preview ?? [];

  return (
    <div className="stencil-in mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="nav-ink text-sm">
            Início
          </Link>
        </div>
      </div>
      <Card className="ink-frame">
        {done ? (
          preview.length > 0 ? (
            <>
              <h1 className="text-2xl font-semibold">Crie a senha nova</h1>
              <p className="mt-1 text-sm text-muted">
                O e-mail ainda não sai desta máquina. Abra o estúdio e escolha uma senha. O link vale por 30 minutos.
              </p>
              <div className="mt-6 space-y-2">
                {preview.map((studio) => (
                  <Link
                    key={studio.url}
                    href={studio.url}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-card-border bg-surface-muted px-4 py-3 text-left transition hover:border-accent/70"
                  >
                    <span>
                      <span className="block font-medium">{studio.name}</span>
                      <span className="text-sm text-muted">{roleLabel(studio.role)}</span>
                    </span>
                    <span className="text-sm text-accent">Abrir</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">Olhe o e-mail</h1>
              <p className="mt-1 text-sm text-muted">{done.message}</p>
            </>
          )
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Esqueci minha senha</h1>
            <p className="mt-1 text-sm text-muted">Informe o e-mail da conta. Se ele estiver em mais de um estúdio, cada um recebe o próprio link.</p>
            <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
              <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nome@email.com" />
              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
              <Button className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          </>
        )}
        <p className="mt-4 text-center text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">
            Voltar para entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
