"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { api } from "@/lib/api";
import { validatePassword } from "@/lib/validators";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [studio, setStudio] = useState("");
  const [checking, setChecking] = useState(true);
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) {
      setExpired(true);
      setChecking(false);
      return;
    }
    api<{ studio: string }>(`/api/v1/auth/password/reset?token=${encodeURIComponent(token)}`)
      .then((data) => setStudio(data.studio))
      .catch(() => setExpired(true))
      .finally(() => setChecking(false));
  }, [token]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirmation = String(fd.get("password_confirmation") ?? "");
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não são iguais.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/v1/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password, password_confirmation: confirmation }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="ink-frame">
      {checking ? (
        <p className="text-sm text-muted">Conferindo o link...</p>
      ) : expired ? (
        <>
          <h1 className="text-2xl font-semibold">Link expirado</h1>
          <p className="mt-1 text-sm text-muted">Peça outro. Ele vale por 30 minutos e só funciona uma vez.</p>
          <Button className="mt-6 w-full" onClick={() => router.push("/esqueci-senha")}>
            Pedir outro link
          </Button>
        </>
      ) : saved ? (
        <>
          <h1 className="text-2xl font-semibold">Senha criada</h1>
          <p className="mt-1 text-sm text-muted">Entre no {studio} com a senha nova.</p>
          <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
            Entrar
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Senha nova</h1>
          <p className="mt-1 text-sm text-muted">Vale para {studio}. Use pelo menos 8 caracteres, com letras e números.</p>
          <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
            <Field label="Senha nova" name="password" type="password" autoComplete="new-password" placeholder="Sua senha nova" />
            <Field label="Repita a senha" name="password_confirmation" type="password" autoComplete="new-password" placeholder="A mesma senha" />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Salvar senha"}
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
  );
}

export default function ResetPasswordPage() {
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
      <Suspense fallback={<Card className="ink-frame"><p className="text-sm text-muted">Carregando...</p></Card>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
