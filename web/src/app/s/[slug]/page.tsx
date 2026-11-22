"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { PublicStudioResponse, publicApi, Slot } from "@/lib/api";
import { cn, formatMoney } from "@/lib/utils";

const steps = ["Serviço", "Artista", "Horário", "Seus dados"] as const;

export default function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PublicStudioResponse | null>(null);
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [artistId, setArtistId] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    publicApi.studio(slug).then(setData).catch(() => setError("Estúdio não encontrado"));
  }, [slug]);

  const service = useMemo(() => data?.services.find((s) => s.id === serviceId), [data, serviceId]);

  useEffect(() => {
    if (!serviceId || !artistId) return;
    const from = new Date().toISOString().slice(0, 10);
    publicApi
      .slots(slug, { artist_id: String(artistId), service_id: String(serviceId), from })
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]));
  }, [slug, serviceId, artistId]);

  async function submitBooking(form: HTMLFormElement) {
    const fd = new FormData(form);
    if (!serviceId || !artistId || !startsAt || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await publicApi.book(slug, {
        service_id: serviceId,
        artist_id: artistId,
        starts_at: startsAt,
        customer_name: fd.get("name"),
        customer_email: fd.get("email"),
        customer_phone: fd.get("phone"),
        notes: fd.get("notes"),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível agendar");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !data) {
    return <p className="p-8 text-center text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="p-8 text-center text-muted">Carregando estúdio...</p>;
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-14 w-14 text-accent" />
        <h1 className="mt-4 text-2xl font-semibold">Agendamento confirmado</h1>
        <p className="mt-2 text-muted">Você receberá a confirmação por e-mail em breve.</p>
        <a href={`/s/${slug}`} className="mt-6 text-accent hover:underline">
          Voltar
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <Logo />
      <div className="mt-8">
        <h1 className="text-3xl font-semibold">{data.studio.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
          {data.studio.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {data.studio.address}
            </span>
          )}
          {data.studio.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-4 w-4" /> {data.studio.phone}
            </span>
          )}
        </div>
      </div>

      <Card className="mt-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <div
              key={label}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                i <= step ? "bg-accent/20 text-accent" : "bg-white/5 text-muted"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-medium">Escolha o serviço</h2>
            {data.services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition",
                  serviceId === s.id ? "border-accent bg-accent/10" : "border-card-border hover:border-accent/40"
                )}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted">
                  {s.duration_minutes} min · {formatMoney(s.price_from_cents)}
                </p>
              </button>
            ))}
            <Button className="w-full" disabled={!serviceId} onClick={() => setStep(1)}>
              Continuar
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-medium">Escolha o artista</h2>
            {data.artists.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setArtistId(a.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left",
                  artistId === a.id ? "border-accent bg-accent/10" : "border-card-border"
                )}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: a.color }} />
                {a.name}
              </button>
            ))}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Voltar
              </Button>
              <Button className="flex-1" disabled={!artistId} onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="font-medium">Horários disponíveis</h2>
            <p className="text-sm text-muted">{service?.name}</p>
            <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={slot.starts_at}
                  type="button"
                  onClick={() => setStartsAt(slot.starts_at)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    startsAt === slot.starts_at ? "border-accent bg-accent/15" : "border-card-border"
                  )}
                >
                  {slot.label}
                </button>
              ))}
              {slots.length === 0 && <p className="col-span-full text-sm text-muted">Sem horários neste período.</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button className="flex-1" disabled={!startsAt} onClick={() => setStep(3)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitBooking(e.currentTarget);
            }}
          >
            <h2 className="font-medium">Seus dados</h2>
            <Input name="name" placeholder="Nome completo" required />
            <Input name="email" type="email" placeholder="E-mail" required />
            <Input name="phone" placeholder="WhatsApp (com DDD)" minLength={10} required />
            <Input name="notes" placeholder="Descreva a ideia da tattoo (opcional)" />
            <label className="flex gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>
                Autorizo o tratamento dos meus dados para agendamento, conforme a{" "}
                <a href="/privacidade" className="text-accent underline" target="_blank" rel="noreferrer">
                  política de privacidade
                </a>
                .
              </span>
            </label>
            <p className="text-xs text-muted">{data.studio.cancellation_policy}</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button className="flex-1" type="submit" disabled={!consent || submitting}>
                {submitting ? "Confirmando..." : "Confirmar agendamento"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}