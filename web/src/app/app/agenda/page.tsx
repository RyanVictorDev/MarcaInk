"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { cn, formatDateTime, statusLabel } from "@/lib/utils";

const STATUS_TONE: Record<string, { idle: string; active: string }> = {
  confirmed: {
    idle: "border-emerald-400/45 text-emerald-300 hover:bg-emerald-400/10 light:border-emerald-800/45 light:bg-emerald-800/10 light:text-emerald-900 light:hover:bg-emerald-800/16",
    active: "border-emerald-400 bg-emerald-400 text-on-accent light:border-emerald-800 light:bg-emerald-800 light:text-white",
  },
  completed: {
    idle: "border-sky-400/45 text-sky-300 hover:bg-sky-400/10 light:border-sky-800/45 light:bg-sky-800/10 light:text-sky-900 light:hover:bg-sky-800/16",
    active: "border-sky-400 bg-sky-400 text-on-accent light:border-sky-800 light:bg-sky-800 light:text-white",
  },
  cancelled: {
    idle: "border-rose-400/45 text-rose-300 hover:bg-rose-400/10 light:border-rose-800/45 light:bg-rose-800/10 light:text-rose-900 light:hover:bg-rose-800/16",
    active: "border-rose-400 bg-rose-400 text-on-accent light:border-rose-800 light:bg-rose-800 light:text-white",
  },
  no_show: {
    idle: "border-violet-400/45 text-violet-300 hover:bg-violet-400/10 light:border-violet-800/45 light:bg-violet-800/10 light:text-violet-900 light:hover:bg-violet-800/16",
    active: "border-violet-400 bg-violet-400 text-on-accent light:border-violet-800 light:bg-violet-800 light:text-white",
  },
};

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
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Agenda</h1>
        <p className="text-muted">Gerencie status das sessões</p>
      </div>
      <Card className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {items.length === 0 && <p className="text-sm text-muted">Sem agendamentos ainda.</p>}
        {items.map((a) => (
          <div key={a.id} className="flex flex-col gap-3 rounded-xl border border-card-border bg-surface-muted p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{a.customer_name}</p>
              <p className="text-sm text-muted">
                {a.service.name} · {a.artist.name}
              </p>
              <p className="text-sm">{formatDateTime(a.starts_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["confirmed", "completed", "cancelled", "no_show"].map((status) => {
                const selected = a.status === status;
                const tone = STATUS_TONE[status];
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm font-medium transition",
                      selected ? tone.active : tone.idle
                    )}
                    onClick={() => setStatus(a.id, status)}
                  >
                    {statusLabel(status)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}