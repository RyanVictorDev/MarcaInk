"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarCheck, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, DashboardData } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { useStaff } from "@/components/staff-context";
import { cn, formatDateTime, statusLabel } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "confirmed") return "border-emerald-400 bg-emerald-400 text-on-accent light:border-emerald-800 light:bg-emerald-800 light:text-white";
  if (status === "completed") return "border-sky-400 bg-sky-400 text-on-accent light:border-sky-800 light:bg-sky-800 light:text-white";
  if (status === "cancelled") return "border-rose-400 bg-rose-400 text-on-accent light:border-rose-800 light:bg-rose-800 light:text-white";
  if (status === "no_show") return "border-violet-400 bg-violet-400 text-on-accent light:border-violet-800 light:bg-violet-800 light:text-white";
  return "border-card-border text-muted";
}

export default function DashboardPage() {
  const { role } = useStaff();
  const [data, setData] = useState<DashboardData | null>(null);
  const ownAgenda = role === "artist";

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<DashboardData>("/api/v1/dashboard", { token }).then(setData);
  }, []);

  if (!data) {
    return <p className="text-muted">Carregando painel...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted">{ownAgenda ? "Visão da sua agenda" : "Visão rápida do estúdio"}</p>
        </div>
        <Link href={data.public_booking_url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            Ver página pública <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Hoje</p>
          <p className="mt-2 text-3xl font-semibold">{data.today_count}</p>
          <CalendarCheck className="mt-2 h-4 w-4 text-accent" />
        </Card>
        <Card>
          <p className="text-sm text-muted">Esta semana</p>
          <p className="mt-2 text-3xl font-semibold">{data.week_count}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Cancelamentos (30d)</p>
          <p className="mt-2 text-3xl font-semibold">{data.cancellation_rate}%</p>
          <TrendingDown className="mt-2 h-4 w-4 text-muted" />
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold">Próximos agendamentos</h2>
        <div className="mt-4 space-y-2">
          {data.upcoming.length === 0 && (
            <p className="text-sm text-muted">Nenhum agendamento futuro. Compartilhe seu link público.</p>
          )}
          {data.upcoming.map((a) => (
            <Link
              key={a.id}
              href={`/app/agenda?sessao=${a.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3 text-left transition hover:bg-hover"
            >
              <span className="min-w-0">
                <span className="block font-medium text-foreground">{a.customer_name}</span>
                <span className="block truncate text-sm text-muted">
                  {a.service}
                  {ownAgenda ? "" : ` · ${a.artist}`}
                </span>
                <span className="mt-1 block text-sm text-foreground">{formatDateTime(a.starts_at)}</span>
              </span>
              <span className={cn("shrink-0 rounded-xl border px-2.5 py-1 text-xs font-medium", statusTone(a.status))}>
                {statusLabel(a.status)}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}