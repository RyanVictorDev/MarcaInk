"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { api, AuthResponse } from "@/lib/api";
import { setToken } from "@/lib/auth-store";
import { validateEmail } from "@/lib/validators";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const emailError = validateEmail(email);
    if (emailError || password.length === 0) {
      setError(emailError ?? "Informe a senha.");
      return;
    }
    setLoading(true);
    try {
      const data = await api<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      setToken(data.token);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-2xl font-semibold">Entrar no painel</h1>
        <p className="mt-1 text-sm text-muted">Gerencie agenda, equipe e assinatura.</p>
        <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
          <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nome@email.com" />
          <Field label="Senha" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Novo estúdio?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Criar conta
          </Link>
        </p>
      </Card>
    </div>
  );
}