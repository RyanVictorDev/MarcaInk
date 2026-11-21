"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, AuthResponse } from "@/lib/api";
import { setToken } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <Card>
        <h1 className="text-2xl font-semibold">Entrar no painel</h1>
        <p className="mt-1 text-sm text-muted">Gerencie agenda, equipe e assinatura.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm text-muted">E-mail</label>
            <Input name="email" type="email" defaultValue="demo@marcaink.app" required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Senha</label>
            <Input name="password" type="password" defaultValue="demo12345" required />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
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