"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { useStaff } from "@/components/staff-context";
import { displayPhone } from "@/lib/validators";
import { cn, formatDateTime, statusLabel } from "@/lib/utils";

const STATUSES = ["confirmed", "completed", "cancelled", "no_show"] as const;

const PERIODS = [
  { id: "upcoming", label: "Próximos" },
  { id: "past", label: "Passados" },
  { id: "all", label: "Todos" },
] as const;

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

type Period = (typeof PERIODS)[number]["id"];

type Appointment = {
  id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  source: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  service: { name: string };
  artist: { id: number; name: string };
};

type ArtistOption = { id: number; name: string };

type Page = {
  appointments: Appointment[];
  page: number;
  total: number;
  total_pages: number;
  artists: ArtistOption[];
};

function clock(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default function AgendaPage() {
  const toast = useToast();
  const { role } = useStaff();
  const [items, setItems] = useState<Appointment[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [period, setPeriod] = useState<Period>("upcoming");
  const [status, setStatus] = useState("");
  const [artistId, setArtistId] = useState("");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [onDate, setOnDate] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const qRef = useRef("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = query.trim();
      if (next === qRef.current) return;
      qRef.current = next;
      setQ(next);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    let ignore = false;

    const load = () => {
      const params = new URLSearchParams({ page: String(page), period });
      if (status) params.set("status", status);
      if (artistId) params.set("artist_id", artistId);
      if (q) params.set("q", q);
      if (onDate) params.set("on", onDate);
      setLoading(true);
      api<Page>(`/api/v1/appointments?${params}`, { token })
        .then((data) => {
          if (ignore) return;
          setItems(data.appointments);
          setTotal(data.total);
          setTotalPages(data.total_pages);
          setArtists(data.artists);
          if (data.page !== page) setPage(data.page);
          setSelected((current) => current && data.appointments.find((item) => item.id === current.id) || current);
        })
        .catch((err) => {
          if (!ignore) toast.error(err instanceof Error ? err.message : "Não foi possível carregar a agenda.");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    };

    load();
    window.addEventListener("marcaink:bookings-changed", load);
    return () => {
      ignore = true;
      window.removeEventListener("marcaink:bookings-changed", load);
    };
  }, [page, period, status, artistId, q, onDate, reloadKey, toast]);

  async function setAppointmentStatus(appointment: Appointment, next: string) {
    const token = getToken();
    if (!token || appointment.status === next) return;
    try {
      const updated = await api<{ appointment: Appointment }>(`/api/v1/appointments/${appointment.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ appointment: { status: next } }),
      });
      setSelected(updated.appointment);
      setReloadKey((current) => current + 1);
      toast.success(`Marcado como ${statusLabel(next).toLowerCase()}`, appointment.customer_name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
    }
  }

  function choosePeriod(next: Period) {
    setPeriod(next);
    setPage(1);
  }

  function chooseStatus(next: string) {
    setStatus(next);
    setPage(1);
  }

  function chooseDate(next: string) {
    setOnDate(next);
    if (next) setPeriod("all");
    setPage(1);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("sessao"));
    if (!id) return;
    const match = items.find((item) => item.id === id);
    if (!match) return;
    setSelected(match);
    params.delete("sessao");
    const next = params.toString();
    window.history.replaceState(null, "", next ? `/app/agenda?${next}` : "/app/agenda");
  }, [items]);

  const narrowed = Boolean(q || status || artistId || (onDate && period !== "all"));
  const empty = !loading && items.length === 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * 20 + 1;
  const rangeEnd = Math.min(page * 20, total);

  return (
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1 md:gap-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">Agenda</h1>
        <p className="text-sm text-muted md:text-base">{role === "artist" ? "Somente as suas sessões." : "Gerencie status das sessões"}</p>
      </div>

      <div className="sticky top-0 z-20 -mx-1 space-y-2 bg-background/95 px-1 py-2 backdrop-blur md:static md:mx-0 md:space-y-3 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            placeholder="Buscar cliente"
            aria-label="Buscar cliente"
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-card-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20 md:px-4 md:py-2.5"
          />
          <DatePicker value={onDate} onChange={chooseDate} placeholder="Qualquer data" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <Select
            value={period}
            options={PERIODS.map((item) => ({ value: item.id, label: item.label }))}
            onChange={(value) => {
              const next = PERIODS.find((item) => item.id === value);
              if (next) choosePeriod(next.id);
            }}
          />
          <Select
            value={status}
            options={[{ value: "", label: "Qualquer status" }, ...STATUSES.map((item) => ({ value: item, label: statusLabel(item) }))]}
            onChange={chooseStatus}
          />
        </div>
        <FilterRow label="Período" className="hidden md:flex">
          {PERIODS.map((item) => (
            <FilterChip key={item.id} pressed={period === item.id} onClick={() => choosePeriod(item.id)}>
              {item.label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Status" className="hidden md:flex">
          <FilterChip pressed={status === ""} onClick={() => chooseStatus("")}>
            Qualquer status
          </FilterChip>
          {STATUSES.map((item) => (
            <FilterChip key={item} pressed={status === item} onClick={() => chooseStatus(item)}>
              {statusLabel(item)}
            </FilterChip>
          ))}
        </FilterRow>
        {role !== "artist" && artists.length > 1 && (
          <div className="w-full md:max-w-xs">
            <Select
              value={artistId}
              placeholder="Todos os tatuadores"
              options={[{ value: "", label: "Todos os tatuadores" }, ...artists.map((artist) => ({ value: String(artist.id), label: artist.name }))]}
              onChange={(value) => {
                setArtistId(value);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      <Card className="space-y-2 p-3 md:min-h-0 md:flex-1 md:space-y-3 md:overflow-y-auto md:p-6">
        <div className="flex items-center justify-between gap-3 text-sm text-muted">
          <p>{loading && items.length === 0 ? "Carregando..." : total === 0 ? "Nenhuma sessão" : total === 1 ? "1 sessão" : `${total} sessões`}</p>
          {total > 0 && <p>{rangeStart}–{rangeEnd}</p>}
        </div>
        {empty && (
          <p className="text-sm text-muted">
            {narrowed ? "Nenhuma sessão com esses filtros." : onDate ? "Nenhuma sessão nessa data." : period === "upcoming" ? "Nada pela frente." : period === "past" ? "Nenhuma sessão passada." : "Sem agendamentos ainda."}
          </p>
        )}
        {items.map((appointment) => (
          <button
            key={appointment.id}
            type="button"
            onClick={() => setSelected(appointment)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-card-border bg-surface-muted p-3 text-left transition hover:border-accent/50 md:p-4"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{appointment.customer_name}</span>
              <span className="block truncate text-sm text-muted">
                {appointment.service.name}
                {role === "artist" ? "" : ` · ${appointment.artist.name}`}
              </span>
              <span className="block text-sm text-foreground">{formatDateTime(appointment.starts_at)}</span>
            </span>
            <span className={cn("shrink-0 rounded-xl border px-2.5 py-1 text-xs font-medium md:px-3 md:text-sm", STATUS_TONE[appointment.status]?.active ?? "border-card-border text-muted")}>
              {statusLabel(appointment.status)}
            </span>
          </button>
        ))}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              className="rounded-xl border border-card-border px-3 py-1.5 text-sm text-foreground transition hover:border-accent/50 disabled:opacity-40"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </button>
            <p className="text-sm text-muted">Página {page} de {totalPages}</p>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-card-border px-3 py-1.5 text-sm text-foreground transition hover:border-accent/50 disabled:opacity-40"
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </Card>

      <Modal open={selected !== null} title={selected?.customer_name ?? "Sessão"} onClose={close}>
        {selected && (
          <div className="space-y-5">
            <div className="space-y-1 text-sm">
              <p className="text-foreground">{formatDateTime(selected.starts_at)} – {clock(selected.ends_at)}</p>
              <p className="text-muted">
                {selected.service.name}
                {role === "artist" ? "" : ` · ${selected.artist.name}`}
              </p>
              <p className="text-muted">{selected.source === "manual" ? "Lançado pela equipe" : "Marcado pelo link"}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted">WhatsApp</dt>
                <dd><a className="text-accent hover:underline" href={`https://wa.me/55${selected.customer_phone.replace(/\D/g, "")}`}>{displayPhone(selected.customer_phone)}</a></dd>
              </div>
              <div>
                <dt className="text-muted">E-mail</dt>
                <dd><a className="text-accent hover:underline" href={`mailto:${selected.customer_email}`}>{selected.customer_email}</a></dd>
              </div>
              {selected.notes && (
                <div>
                  <dt className="text-muted">Observação</dt>
                  <dd className="whitespace-pre-wrap text-foreground">{selected.notes}</dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((item) => {
                const chosen = selected.status === item;
                const tone = STATUS_TONE[item];
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={chosen}
                    className={cn("rounded-xl border px-3 py-1.5 text-sm font-medium transition", chosen ? tone.active : tone.idle)}
                    onClick={() => setAppointmentStatus(selected, item)}
                  >
                    {statusLabel(item)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function FilterRow({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {children}
    </div>
  );
}

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-xl border px-2.5 py-1 text-xs transition md:px-3 md:py-1.5 md:text-sm",
        pressed ? "border-accent/60 bg-accent/15 text-accent" : "border-card-border text-muted hover:bg-hover hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
