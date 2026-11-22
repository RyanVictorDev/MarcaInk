"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarCheck, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, DashboardData } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

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
          <p className="text-muted">Visão rápida do estúdio</p>
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
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/35 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{a.customer_name}</p>
                <p className="text-muted">
                  {a.service} · {a.artist}
                </p>
              </div>
              <div className="text-right">
                <p>{formatDateTime(a.starts_at)}</p>
                <p className="text-accent">{a.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}