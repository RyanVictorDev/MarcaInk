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
import {
  formatBrazilPhone,
  normalizePhone,
  validateBrazilPhone,
  validateEmail,
  validatePassword,
  validatePersonName,
  validateSlug,
  validateStudioName,
} from "@/lib/validators";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FormState = {
  studioName: string;
  slug: string;
  ownerName: string;
  phone: string;
  email: string;
  password: string;
};

const empty: FormState = { studioName: "", slug: "", ownerName: "", phone: "", email: "", password: "" };

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});

  function collectErrors(values: FormState) {
    return {
      studioName: validateStudioName(values.studioName) ?? undefined,
      slug: validateSlug(values.slug) ?? undefined,
      ownerName: validatePersonName(values.ownerName) ?? undefined,
      phone: validateBrazilPhone(values.phone, false) ?? undefined,
      email: validateEmail(values.email) ?? undefined,
      password: validatePassword(values.password) ?? undefined,
    };
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: collectErrors(next)[key] }));
    }
  }

  function blur(key: keyof FormState, value?: string) {
    const next = value === undefined ? form : { ...form, [key]: key === "slug" ? slugify(value) : value };
    setForm(next);
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldErrors((prev) => ({ ...prev, [key]: collectErrors(next)[key] }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = collectErrors(form);
    setFieldErrors(nextErrors);
    setTouched({ studioName: true, slug: true, ownerName: true, phone: true, email: true, password: true });
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    setError("");
    try {
      const data = await api<AuthResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          studio: {
            name: form.studioName.trim(),
            slug: form.slug,
            phone: form.phone ? normalizePhone(form.phone) : "",
          },
          owner_name: form.ownerName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
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
    <div className="stencil-in mx-auto max-w-lg px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="nav-ink text-sm">
            Início
          </Link>
        </div>
      </div>
      <Card className="ink-frame mt-8">
        <h1 className="text-2xl font-semibold">Criar estúdio</h1>
        <p className="text-sm text-muted">14 dias de trial · link público na hora</p>
        <form className="mt-6 space-y-4" noValidate onSubmit={onSubmit}>
          <Field
            label="Nome do estúdio"
            name="studio_name"
            placeholder="Black Needle Studio"
            value={form.studioName}
            error={touched.studioName ? fieldErrors.studioName : undefined}
            onChange={(e) => {
              const studioName = e.target.value;
              const next = { ...form, studioName, slug: slugEdited ? form.slug : slugify(studioName) };
              setForm(next);
              if (touched.studioName || touched.slug) {
                const errors = collectErrors(next);
                setFieldErrors((prev) => ({
                  ...prev,
                  studioName: touched.studioName ? errors.studioName : prev.studioName,
                  slug: touched.slug ? errors.slug : prev.slug,
                }));
              }
            }}
            onBlur={(e) => blur("studioName", e.target.value)}
          />
          <Field
            label="Link público"
            name="slug"
            placeholder="black-needle"
            value={form.slug}
            error={touched.slug ? fieldErrors.slug : undefined}
            hint={`Seu link: /s/${form.slug || "seu-studio"}`}
            onChange={(e) => {
              setSlugEdited(true);
              update("slug", slugify(e.target.value));
            }}
            onBlur={(e) => blur("slug", e.target.value)}
          />
          <Field
            label="Seu nome"
            name="owner_name"
            autoComplete="name"
            placeholder="Nome e sobrenome"
            value={form.ownerName}
            error={touched.ownerName ? fieldErrors.ownerName : undefined}
            onChange={(e) => update("ownerName", e.target.value)}
            onBlur={(e) => blur("ownerName", e.target.value)}
          />
          <Field
            label="WhatsApp do estúdio"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            value={form.phone}
            error={touched.phone ? fieldErrors.phone : undefined}
            hint="Opcional"
            onChange={(e) => update("phone", formatBrazilPhone(e.target.value))}
            onBlur={(e) => blur("phone", formatBrazilPhone(e.target.value))}
          />
          <Field
            label="E-mail"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nome@email.com"
            value={form.email}
            error={touched.email ? fieldErrors.email : undefined}
            onChange={(e) => update("email", e.target.value)}
            onBlur={(e) => blur("email", e.target.value)}
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres, com letras e números"
            value={form.password}
            error={touched.password ? fieldErrors.password : undefined}
            onChange={(e) => update("password", e.target.value)}
            onBlur={(e) => blur("password", e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta gratuita"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
