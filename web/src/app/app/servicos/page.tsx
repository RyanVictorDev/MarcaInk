"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { formatMoney } from "@/lib/utils";

type Service = {
  id: number;
  name: string;
  kind: string;
  duration_minutes: number;
  price_from_cents: number;
  active: boolean;
  price_from_label?: string;
};

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ services: Service[] }>("/api/v1/services", { token }).then((r) => setServices(r.services));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Serviços</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((s) => (
          <Card key={s.id}>
            <p className="text-xs uppercase tracking-wide text-muted">{s.kind}</p>
            <h3 className="mt-1 text-xl font-semibold">{s.name}</h3>
            <p className="mt-2 text-sm text-muted">{s.duration_minutes} minutos</p>
            <p className="mt-3 text-accent">{s.price_from_label ?? formatMoney(s.price_from_cents)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}