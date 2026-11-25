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
import { roleLabel } from "@/lib/roles";
import { validateEmail } from "@/lib/validators";

type StudioChoice = { user_id: number; name: string; slug: string; role: string };
type LoginChoice = { choose_studio: true; login_token: string; studios: StudioChoice[] };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [choices, setChoices] = useState<LoginChoice | null>(null);

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
      const data = await api<AuthResponse | LoginChoice>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if ("choose_studio" in data) {
        setChoices(data);
        return;
      }
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
        {choices ? (
          <StudioPicker choices={choices} onBack={() => setChoices(null)} />
        ) : (
        <>
        <h1 className="text-2xl font-semibold">Entrar no painel</h1>
        <p className="mt-1 text-sm text-muted">Gerencie agenda, equipe e assinatura.</p>
        <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
          <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nome@email.com" />
          <Field label="Senha" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" />
          <p className="text-right text-sm">
            <Link href="/esqueci-senha" className="text-muted hover:text-accent">
              Esqueci minha senha
            </Link>
          </p>
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
        </>
        )}
      </Card>
    </div>
  );
}

function StudioPicker({ choices, onBack }: { choices: LoginChoice; onBack: () => void }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<number | null>(null);

  async function openStudio(userId: number) {
    setError("");
    setOpening(userId);
    try {
      const data = await api<AuthResponse>("/api/v1/auth/login/studio", {
        method: "POST",
        body: JSON.stringify({ login_token: choices.login_token, user_id: userId }),
      });
      setToken(data.token);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir esse estúdio.");
      setOpening(null);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Qual estúdio?</h1>
      <p className="mt-1 text-sm text-muted">Esse e-mail entra em mais de um. Escolha onde quer trabalhar agora.</p>
      <div className="mt-6 space-y-2">
        {choices.studios.map((studio) => (
          <button
            key={studio.user_id}
            type="button"
            disabled={opening !== null}
            onClick={() => openStudio(studio.user_id)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-card-border bg-surface-muted px-4 py-3 text-left transition hover:border-accent/70 disabled:opacity-60"
          >
            <span>
              <span className="block font-medium">{studio.name}</span>
              <span className="text-sm text-muted">{roleLabel(studio.role)} · /s/{studio.slug}</span>
            </span>
            <span className="text-sm text-accent">{opening === studio.user_id ? "Abrindo..." : "Entrar"}</span>
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="button" className="mt-4 text-sm text-muted hover:text-foreground" onClick={onBack}>
        Voltar
      </button>
    </>
  );
}