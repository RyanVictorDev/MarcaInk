"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, Studio } from "@/lib/api";
import { getToken } from "@/lib/auth-store";

export default function ConfigPage() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ studio: Studio }>("/api/v1/studio", { token }).then((r) => setStudio(r.studio));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getToken();
    if (!token || !studio) return;
    const fd = new FormData(e.currentTarget);
    const updated = await api<{ studio: Studio }>("/api/v1/studio", {
      method: "PATCH",
      token,
      body: JSON.stringify({
        studio: {
          name: fd.get("name"),
          phone: fd.get("phone"),
          address: fd.get("address"),
          instagram: fd.get("instagram"),
          cancellation_policy: fd.get("cancellation_policy"),
        },
      }),
    });
    setStudio(updated.studio);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!studio) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold">Configurações</h1>
      <Card>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input name="name" defaultValue={studio.name} placeholder="Nome do estúdio" />
          <Input name="phone" defaultValue={studio.phone ?? ""} placeholder="Telefone" />
          <Input name="address" defaultValue={studio.address ?? ""} placeholder="Endereço" />
          <Input name="instagram" defaultValue={studio.instagram ?? ""} placeholder="Instagram" />
          <textarea
            name="cancellation_policy"
            defaultValue={studio.cancellation_policy ?? ""}
            className="min-h-28 w-full rounded-xl border border-card-border bg-[#0d0d0d] px-4 py-2.5 text-sm"
          />
          <Button type="submit">Salvar</Button>
          {saved && <p className="text-sm text-emerald-400">Salvo com sucesso.</p>}
        </form>
      </Card>
    </div>
  );
}