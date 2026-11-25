"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextField } from "@/components/ui/field";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PublicStudioResponse, publicApi, Slot } from "@/lib/api";
import { displayPhone, formatBrazilPhone, normalizePhone, validateBrazilPhone, validateEmail, validateNotes, validatePersonName } from "@/lib/validators";
import { cn, formatMoney } from "@/lib/utils";

const steps = ["Serviço", "Artista", "Horário", "Seus dados"] as const;

type Customer = { name: string; email: string; phone: string; notes: string };
type FieldKey = keyof Customer | "consent";

const emptyCustomer: Customer = { name: "", email: "", phone: "", notes: "" };

function BookingTop() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Logo />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link href="/" className="nav-ink text-sm">
          Início
        </Link>
      </div>
    </div>
  );
}

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
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  useEffect(() => {
    publicApi.studio(slug).then(setData).catch(() => setError("Estúdio não encontrado"));
  }, [slug]);

  const service = useMemo(() => data?.services.find((s) => s.id === serviceId), [data, serviceId]);

  useEffect(() => {
    if (!serviceId || !artistId) return;
    let cancelled = false;
    setSlots([]);
    setStartsAt(null);
    const from = new Date().toISOString().slice(0, 10);
    publicApi
      .slots(slug, { artist_id: String(artistId), service_id: String(serviceId), from })
      .then((r) => {
        if (!cancelled) setSlots(r.slots);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, artistId]);

  function errorsFor(values: Customer, accepted: boolean) {
    return {
      name: validatePersonName(values.name) ?? undefined,
      email: validateEmail(values.email) ?? undefined,
      phone: validateBrazilPhone(values.phone) ?? undefined,
      notes: validateNotes(values.notes) ?? undefined,
      consent: accepted ? undefined : "Autorize o uso dos dados para concluir o agendamento.",
    };
  }

  function showError(key: FieldKey) {
    return touched[key] ? fieldErrors[key] : undefined;
  }

  function touch(key: FieldKey, values = customer, accepted = consent) {
    const next = errorsFor(values, accepted);
    setTouched((prev) => ({ ...prev, [key]: true }));
    setFieldErrors((prev) => ({ ...prev, [key]: next[key] }));
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = errorsFor(customer, consent);
    setFieldErrors(next);
    setTouched({ name: true, email: true, phone: true, notes: true, consent: true });
    if (Object.values(next).some(Boolean) || !serviceId || !artistId || !startsAt || submitting) return;

    setError("");
    setSubmitting(true);
    try {
      await publicApi.book(slug, {
        service_id: serviceId,
        artist_id: artistId,
        starts_at: startsAt,
        customer_name: customer.name.trim().replace(/\s+/g, " "),
        customer_email: customer.email.trim().toLowerCase(),
        customer_phone: normalizePhone(customer.phone),
        notes: customer.notes.trim(),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível agendar");
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !data) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
        <BookingTop />
        <p className="p-8 text-center text-danger">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
        <BookingTop />
        <p className="p-8 text-center text-muted">Carregando estúdio...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="stencil-in mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <svg viewBox="0 0 72 72" className="h-16 w-16" aria-hidden>
          <circle className="ink-stroke" cx="36" cy="36" r="30" />
          <path className="ink-check" d="M22 38 l10 10 18-22" />
        </svg>
        <h1 className="mt-4 text-2xl font-semibold">Agendamento confirmado</h1>
        <p className="mt-2 text-muted">O estúdio já recebeu seu horário. Guarde o e-mail de confirmação.</p>
        <div className="mt-6 flex gap-4 text-sm">
          <a href={`/s/${slug}`} className="text-accent hover:underline">
            Fazer outro agendamento
          </a>
          <Link href="/" className="nav-ink">
            Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-8">
      <BookingTop />
      <div className="stencil-in mt-8">
        <h1 className="text-3xl font-semibold">{data.studio.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted">
          {data.studio.address && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {data.studio.address}
            </span>
          )}
          {data.studio.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-4 w-4" /> {displayPhone(data.studio.phone)}
            </span>
          )}
        </div>
      </div>

      <Card className="ink-frame stencil-in mt-8" style={{ animationDelay: "90ms" }}>
        <div className="mb-3 flex justify-between text-xs text-muted">
          <span>
            Passo {step + 1} de {steps.length}
          </span>
          <span>{steps[step]}</span>
        </div>
        <div className="needle-track mb-5" aria-hidden>
          <div className="needle-fill" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((label, i) => (
            <div
              key={label}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition",
                i === step ? "bg-accent-fill text-on-accent" : i < step ? "bg-accent/20 text-accent" : "bg-hover text-muted"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        <div key={step} className="stencil-in">
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
                    {s.duration_minutes} min · {s.price_from_cents ? `a partir de ${formatMoney(s.price_from_cents)}` : formatMoney(s.price_from_cents)}
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
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                    artistId === a.id ? "border-accent bg-accent/10" : "border-card-border hover:border-accent/40"
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
                      "rounded-lg border px-3 py-2 text-sm transition",
                      startsAt === slot.starts_at ? "border-accent bg-accent/15" : "border-card-border hover:border-accent/40"
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
            <form className="space-y-3" noValidate onSubmit={submitBooking}>
              <h2 className="font-medium">Seus dados</h2>
              <Field
                label="Nome completo"
                name="name"
                autoComplete="name"
                placeholder="Nome e sobrenome"
                value={customer.name}
                error={showError("name")}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={(e) => touch("name", { ...customer, name: e.target.value })}
              />
              <Field
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="nome@email.com"
                value={customer.email}
                error={showError("email")}
                onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={(e) => touch("email", { ...customer, email: e.target.value })}
              />
              <Field
                label="WhatsApp"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="(11) 98765-4321"
                value={customer.phone}
                error={showError("phone")}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  const phone = formatBrazilPhone(e.target.value);
                  const next = { ...customer, phone };
                  setCustomer(next);
                  if (raw.length > 13) {
                    setTouched((prev) => ({ ...prev, phone: true }));
                    setFieldErrors((prev) => ({ ...prev, phone: "Esse número está longo demais." }));
                  } else if (touched.phone) {
                    touch("phone", next);
                  }
                }}
                onBlur={(e) => touch("phone", { ...customer, phone: formatBrazilPhone(e.target.value) })}
              />
              <TextField
                label="Ideia da tattoo"
                name="notes"
                placeholder="Opcional — estilo, local do corpo, referências"
                maxLength={500}
                value={customer.notes}
                error={showError("notes")}
                hint={`${customer.notes.length}/500`}
                onChange={(e) => setCustomer((prev) => ({ ...prev, notes: e.target.value }))}
                onBlur={(e) => touch("notes", { ...customer, notes: e.target.value })}
              />
              <div>
                <label className="flex gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={consent}
                    onChange={(e) => {
                      const accepted = e.target.checked;
                      setConsent(accepted);
                      if (touched.consent) touch("consent", customer, accepted);
                    }}
                    onBlur={() => touch("consent")}
                  />
                  <span>
                    Autorizo o tratamento dos meus dados para agendamento, conforme a{" "}
                    <a href="/privacidade" className="text-accent underline" target="_blank" rel="noreferrer">
                      política de privacidade
                    </a>
                    .
                  </span>
                </label>
                {showError("consent") && (
                  <p role="alert" className="mt-1.5 text-xs text-danger">
                    {fieldErrors.consent}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted">{data.studio.cancellation_policy}</p>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <Button className="flex-1" type="submit" disabled={submitting}>
                  {submitting ? "Confirmando..." : "Confirmar agendamento"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
