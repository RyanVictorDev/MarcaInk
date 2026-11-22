"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, Studio } from "@/lib/api";
import { getToken } from "@/lib/auth-store";

export default function AssinaturaPage() {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ studio: Studio }>("/api/v1/studio", { token }).then((r) => setStudio(r.studio));
  }, []);

  async function activate(plan: string) {
    const token = getToken();
    if (!token) return;
    const res = await api<{ mode: string; message: string; checkout_url?: string }>("/api/v1/billing/checkout", {
      method: "POST",
      token,
      body: JSON.stringify({ plan }),
    });
    if (res.mode === "abacate" && res.checkout_url) {
      window.location.href = res.checkout_url;
      return;
    }
    setMessage(res.message);
    const me = await api<{ studio: Studio }>("/api/v1/studio", { token });
    setStudio(me.studio);
  }

  if (!studio) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Assinatura</h1>
      <Card>
        <p className="text-sm text-muted">Status</p>
        <p className="mt-1 text-2xl font-semibold capitalize">{studio.subscription_status}</p>
        <p className="mt-2 text-sm text-muted">
          Plano atual: <span className="text-foreground">{studio.plan}</span>
        </p>
        {studio.trial_ends_at && (
          <p className="mt-1 text-sm text-muted">Trial até {new Date(studio.trial_ends_at).toLocaleDateString("pt-BR")}</p>
        )}
      </Card>
      <Card className="space-y-3">
        <p className="font-medium">Ativar com AbacatePay</p>
        <p className="text-sm text-muted">Pagamento recorrente via AbacatePay (Pix ou cartão).</p>
        <div className="flex flex-wrap gap-2">
          {["solo", "studio", "pro"].map((plan) => (
            <Button key={plan} variant="outline" onClick={() => activate(plan)}>
              Plano {plan}
            </Button>
          ))}
        </div>
        {message && <p className="text-sm text-accent">{message}</p>}
      </Card>
    </div>
  );
}