"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextField } from "@/components/ui/field";
import { api, Studio } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import {
  displayPhone,
  formatBrazilPhone,
  normalizePhone,
  validateBrazilPhone,
  validateInstagram,
  validatePolicy,
  validateStudioName,
} from "@/lib/validators";

export default function ConfigPage() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [policy, setPolicy] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ studio: Studio }>("/api/v1/studio", { token }).then((r) => {
      setStudio(r.studio);
      setName(r.studio.name);
      setPhone(displayPhone(r.studio.phone));
      setAddress(r.studio.address ?? "");
      setInstagram(r.studio.instagram ?? "");
      setPolicy(r.studio.cancellation_policy ?? "");
    });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token || !studio) return;
    const next: Record<string, string> = {};
    const nameError = validateStudioName(name);
    const phoneError = validateBrazilPhone(phone, false);
    const instagramError = validateInstagram(instagram);
    const policyError = validatePolicy(policy);
    if (nameError) next.name = nameError;
    if (phoneError) next.phone = phoneError;
    if (instagramError) next.instagram = instagramError;
    if (policyError) next.policy = policyError;
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setError("");
    try {
      const updated = await api<{ studio: Studio }>("/api/v1/studio", {
        method: "PATCH",
        token,
        body: JSON.stringify({
          studio: {
            name: name.trim(),
            phone: phone ? normalizePhone(phone) : "",
            address: address.trim(),
            instagram: instagram.trim(),
            cancellation_policy: policy.trim(),
          },
        }),
      });
      setStudio(updated.studio);
      setPhone(displayPhone(updated.studio.phone));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar");
    }
  }

  if (!studio) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="stencil-in max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Configurações</h1>
      <Card className="ink-frame">
        <form className="space-y-4" noValidate onSubmit={onSubmit}>
          <Field label="Nome do estúdio" name="name" value={name} error={fieldErrors.name} onChange={(e) => setName(e.target.value)} />
          <Field
            label="WhatsApp"
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            error={fieldErrors.phone}
            placeholder="(11) 98765-4321"
            onChange={(e) => setPhone(formatBrazilPhone(e.target.value))}
          />
          <Field label="Endereço" name="address" value={address} placeholder="Rua, número, bairro" onChange={(e) => setAddress(e.target.value)} />
          <Field
            label="Instagram"
            name="instagram"
            value={instagram}
            error={fieldErrors.instagram}
            placeholder="@estudio"
            onChange={(e) => setInstagram(e.target.value)}
          />
          <TextField
            label="Política de cancelamento"
            name="cancellation_policy"
            value={policy}
            error={fieldErrors.policy}
            hint={`${policy.length}/800`}
            maxLength={800}
            onChange={(e) => setPolicy(e.target.value)}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit">Salvar</Button>
          {saved && <p className="text-sm text-success">Salvo com sucesso.</p>}
        </form>
      </Card>
    </div>
  );
}
