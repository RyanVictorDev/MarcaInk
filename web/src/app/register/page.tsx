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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const data = await api<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          studio: {
            name: fd.get("studio_name"),
            slug: fd.get("slug") || slugify(String(fd.get("studio_name"))),
            phone: fd.get("phone"),
          },
          owner_name: fd.get("owner_name"),
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      setToken(data.token);
      router.push("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link href="/">
        <Logo />
      </Link>
      <Card className="mt-8">
        <h1 className="text-2xl font-semibold">Criar estúdio</h1>
        <p className="text-sm text-muted">14 dias de trial · link público na hora</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={onSubmit}
          onInput={(e) => {
            const el = e.target;
            if (el instanceof HTMLInputElement && el.name === "studio_name") {
              setSlug(slugify(el.value));
            }
          }}
        >
          <Input name="studio_name" placeholder="Nome do estúdio" required />
          <Input name="slug" placeholder="slug-do-link" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <p className="-mt-2 text-xs text-muted">Seu link: /s/{slug || "seu-studio"}</p>
          <Input name="owner_name" placeholder="Seu nome" required />
          <Input name="phone" placeholder="WhatsApp do estúdio" />
          <Input name="email" type="email" placeholder="E-mail do dono" required />
          <Input name="password" type="password" placeholder="Senha (mín. 8 caracteres)" minLength={8} required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta gratuita"}
          </Button>
        </form>
      </Card>
    </div>
  );
}