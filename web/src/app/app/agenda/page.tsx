"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { formatDateTime } from "@/lib/utils";

type Appointment = {
  id: number;
  starts_at: string;
  status: string;
  customer_name: string;
  service: { name: string };
  artist: { name: string };
};

export default function AgendaPage() {
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ appointments: Appointment[] }>("/api/v1/appointments", { token }).then((r) => setItems(r.appointments));
  }, []);

  async function setStatus(id: number, status: string) {
    const token = getToken();
    if (!token) return;
    await api(`/api/v1/appointments/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ appointment: { status } }),
    });
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Agenda</h1>
        <p className="text-muted">Gerencie status das sessões</p>
      </div>
      <Card className="space-y-3">
        {items.length === 0 && <p className="text-sm text-muted">Sem agendamentos ainda.</p>}
        {items.map((a) => (
          <div key={a.id} className="flex flex-col gap-3 rounded-xl border border-card-border bg-black/30 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{a.customer_name}</p>
              <p className="text-sm text-muted">
                {a.service.name} · {a.artist.name}
              </p>
              <p className="text-sm">{formatDateTime(a.starts_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["confirmed", "completed", "cancelled", "no_show"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={a.status === status ? "primary" : "outline"}
                  onClick={() => setStatus(a.id, status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}