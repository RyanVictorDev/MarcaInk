"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useStaff } from "@/components/staff-context";
import { api } from "@/lib/api";
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
import { cn } from "@/lib/utils";

type Studio = {
  name: string;
  phone?: string | null;
  address?: string | null;
  instagram?: string | null;
  cancellation_policy?: string | null;
};

type Hour = { day_of_week: number; open: boolean; opens_at: string; closes_at: string };
type ClosedDay = { id: number; day: string; note: string | null };

const WEEK = [
  { day: 1, label: "Segunda" },
  { day: 2, label: "Terça" },
  { day: 3, label: "Quarta" },
  { day: 4, label: "Quinta" },
  { day: 5, label: "Sexta" },
  { day: 6, label: "Sábado" },
  { day: 0, label: "Domingo" },
];

function localToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const timeClass =
  "rounded-xl border border-card-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-40";

export default function ConfigPage() {
  const toast = useToast();
  const { role } = useStaff();
  const readOnly = role === "artist";
  const [studio, setStudio] = useState<Studio | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [policy, setPolicy] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hours, setHours] = useState<Hour[]>([]);
  const [savingHours, setSavingHours] = useState(false);
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [closedDate, setClosedDate] = useState("");
  const [closedNote, setClosedNote] = useState("");

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
    api<{ hours: Hour[]; closed_days: ClosedDay[] }>("/api/v1/schedule", { token }).then((r) => {
      setHours(r.hours);
      setClosedDays(r.closed_days);
    });
  }, []);

  function updateHour(day: number, patch: Partial<Hour>) {
    setHours((current) => current.map((hour) => (hour.day_of_week === day ? { ...hour, ...patch } : hour)));
  }

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
      toast.success("Dados do estúdio salvos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar");
    }
  }

  async function saveHours() {
    const token = getToken();
    if (!token) return;
    if (!hours.some((hour) => hour.open)) {
      toast.error("Deixe pelo menos um dia aberto.");
      return;
    }
    const invalid = hours.find((hour) => hour.open && hour.closes_at <= hour.opens_at);
    if (invalid) {
      toast.error("O fechamento precisa ser depois da abertura.");
      return;
    }
    setSavingHours(true);
    try {
      const updated = await api<{ hours: Hour[] }>("/api/v1/schedule", {
        method: "PATCH",
        token,
        body: JSON.stringify({ hours }),
      });
      setHours(updated.hours);
      toast.success("Horários salvos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar os horários.");
    } finally {
      setSavingHours(false);
    }
  }

  async function addClosedDay(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!closedDate) {
      toast.error("Escolha o dia.");
      return;
    }
    try {
      const created = await api<{ closed_day: ClosedDay }>("/api/v1/closed_days", {
        method: "POST",
        token,
        body: JSON.stringify({ closed_day: { day: closedDate, note: closedNote.trim() } }),
      });
      setClosedDays((current) => [...current, created.closed_day].sort((a, b) => a.day.localeCompare(b.day)));
      setClosedDate("");
      setClosedNote("");
      toast.success("Dia fechado", created.closed_day.note || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível fechar esse dia.");
    }
  }

  async function removeClosedDay(id: number) {
    const token = getToken();
    if (!token) return;
    try {
      await api(`/api/v1/closed_days/${id}`, { method: "DELETE", token });
      setClosedDays((current) => current.filter((day) => day.id !== id));
      toast.success("Dia reaberto");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível reabrir esse dia.");
    }
  }

  if (!studio) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="stencil-in space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Configurações</h1>
        <p className="text-muted">
          {readOnly
            ? "Dias em que a loja funciona. Quem altera é o dono ou o tatuador responsável."
            : "Dados do estúdio, semana de trabalho e dias fechados."}
        </p>
      </div>
      <div className={readOnly ? "" : "grid items-start gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]"}>
        {!readOnly && <Card className="ink-frame">
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
            <Button type="submit">Salvar dados</Button>
          </form>
        </Card>}

        <div className="space-y-6">
          <Card className="ink-frame">
            <h2 className="text-lg font-semibold">Funcionamento</h2>
            <p className="mt-1 text-sm text-muted">Vale para o estúdio inteiro. O cliente só vê horários dentro desses dias.</p>
            <div className="mt-5 space-y-2">
              {WEEK.map(({ day, label }) => {
                const hour = hours.find((item) => item.day_of_week === day);
                if (!hour) return null;
                return (
                  <div key={day} className="flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-surface-muted px-3 py-2">
                    {readOnly ? (
                      <span className={cn("w-28 text-sm font-medium", hour.open ? "text-foreground" : "text-muted")}>{label}</span>
                    ) : (
                      <button
                        type="button"
                        aria-pressed={hour.open}
                        className={cn(
                          "w-28 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition",
                          hour.open ? "bg-accent-fill text-on-accent" : "text-muted hover:bg-hover hover:text-foreground"
                        )}
                        onClick={() => updateHour(day, { open: !hour.open })}
                      >
                        {label}
                      </button>
                    )}
                    {hour.open ? (
                      readOnly ? (
                        <span className="text-sm">{hour.opens_at} até {hour.closes_at}</span>
                      ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          aria-label={`${label} abre às`}
                          type="time"
                          className={timeClass}
                          value={hour.opens_at}
                          onChange={(e) => updateHour(day, { opens_at: e.target.value })}
                        />
                        <span className="text-muted">até</span>
                        <input
                          aria-label={`${label} fecha às`}
                          type="time"
                          className={timeClass}
                          value={hour.closes_at}
                          onChange={(e) => updateHour(day, { closes_at: e.target.value })}
                        />
                      </div>
                      )
                    ) : (
                      <span className="text-sm text-muted">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
            {!readOnly && (
            <div className="mt-4">
              <Button type="button" onClick={saveHours} disabled={savingHours || hours.length === 0}>
                {savingHours ? "Salvando..." : "Salvar horários"}
              </Button>
            </div>
            )}
          </Card>

          <Card className="ink-frame">
            <h2 className="text-lg font-semibold">Dias fechados</h2>
            <p className="mt-1 text-sm text-muted">
              {readOnly ? "Dias em que a loja não abre, mesmo estando na semana." : "Feriado, folga ou viagem. Esse dia some do link, mesmo estando na semana."}
            </p>
            {!readOnly && <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={addClosedDay}>
              <label className="text-sm text-muted">
                Dia
                <DatePicker className="mt-1.5" min={localToday()} value={closedDate} onChange={setClosedDate} />
              </label>
              <label className="min-w-48 flex-1 text-sm text-muted">
                Motivo
                <input
                  type="text"
                  maxLength={80}
                  placeholder="Natal, folga, convenção"
                  value={closedNote}
                  onChange={(e) => setClosedNote(e.target.value)}
                  className={`${timeClass} mt-1.5 block w-full`}
                />
              </label>
              <Button type="submit">Fechar dia</Button>
            </form>}
            <ul className="mt-4 space-y-2">
              {closedDays.length === 0 && <li className="text-sm text-muted">Nenhum dia fechado pela frente.</li>}
              {closedDays.map((closed) => (
                <li key={closed.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-3 py-2 text-sm">
                  <span>
                    {new Date(`${closed.day}T12:00:00`).toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                    {closed.note ? <span className="text-muted"> · {closed.note}</span> : null}
                  </span>
                  {!readOnly && (
                  <button type="button" className="text-muted hover:text-foreground" onClick={() => removeClosedDay(closed.id)}>
                    Reabrir
                  </button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
