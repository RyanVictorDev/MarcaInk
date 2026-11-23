"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ApiError, api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { parsePriceToCents, validateDuration, validateServiceName } from "@/lib/validators";
import { Select } from "@/components/ui/select";
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

type Kind = (typeof KINDS)[number]["value"];

const KINDS = [
  { value: "consultation", label: "Consulta" },
  { value: "session", label: "Sessão" },
  { value: "touch_up", label: "Retoque" },
] as const;

const KIND_LABEL: Record<string, string> = Object.fromEntries(KINDS.map((kind) => [kind.value, kind.label]));

function isKind(value: string): value is Kind {
  return KINDS.some((option) => option.value === value);
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("session");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ services: Service[] }>("/api/v1/services", { token })
      .then((r) => setServices(r.services.filter((service) => service.active)))
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Não foi possível carregar os serviços."))
      .finally(() => setLoading(false));
  }, []);

  function clearForm() {
    setFormMode(null);
    setEditingId(null);
    setName("");
    setKind("session");
    setDuration("60");
    setPrice("");
    setFieldErrors({});
    setFormError("");
  }

  const closeForm = useCallback(() => {
    if (saving) return;
    setFormMode(null);
    setEditingId(null);
    setName("");
    setKind("session");
    setDuration("60");
    setPrice("");
    setFieldErrors({});
    setFormError("");
  }, [saving]);

  const closeDelete = useCallback(() => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError("");
  }, [deleting]);

  function openCreate() {
    setPendingDelete(null);
    setEditingId(null);
    setName("");
    setKind("session");
    setDuration("60");
    setPrice("");
    setFieldErrors({});
    setFormError("");
    setFormMode("create");
  }

  function openEdit(service: Service) {
    setPendingDelete(null);
    setEditingId(service.id);
    setName(service.name);
    setKind(isKind(service.kind) ? service.kind : "session");
    setDuration(String(service.duration_minutes));
    setPrice(service.price_from_cents ? (service.price_from_cents / 100).toFixed(2).replace(".", ",") : "");
    setFieldErrors({});
    setFormError("");
    setFormMode("edit");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getToken();
    if (!token || saving || !formMode) return;

    const next: Record<string, string> = {};
    const nameError = validateServiceName(name);
    const durationError = validateDuration(duration);
    const parsedPrice = parsePriceToCents(price);
    if (nameError) next.name = nameError;
    if (durationError) next.duration_minutes = durationError;
    if ("error" in parsedPrice) next.price_from_cents = parsedPrice.error;
    setFieldErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0 || "error" in parsedPrice) return;

    const payload = {
      service: {
        name: name.trim().replace(/\s+/g, " "),
        kind,
        duration_minutes: Number(duration),
        price_from_cents: parsedPrice.cents,
      },
    };

    setSaving(true);
    try {
      const saved = await api<{ service: Service }>(editingId ? `/api/v1/services/${editingId}` : "/api/v1/services", {
        method: editingId ? "PATCH" : "POST",
        token,
        body: JSON.stringify(payload),
      });
      setServices((prev) =>
        [...prev.filter((service) => service.id !== saved.service.id), saved.service]
          .filter((service) => service.active)
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      );
      setSaving(false);
      clearForm();
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const mapped: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.fields)) mapped[key] = messages[0] ?? err.message;
        setFieldErrors(mapped);
      }
      setFormError(err instanceof Error ? err.message : "Não foi possível salvar o serviço.");
      setSaving(false);
    }
  }

  async function removeService() {
    const token = getToken();
    if (!token || deleting || !pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api(`/api/v1/services/${pendingDelete.id}`, { method: "DELETE", token });
      setServices((prev) => prev.filter((service) => service.id !== pendingDelete.id));
      setDeleting(false);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Não foi possível excluir o serviço.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Serviços</h1>
          <p className="mt-1 text-sm text-muted">O cliente escolhe um destes no link público de agendamento.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          Novo serviço
        </Button>
      </div>

      {loading && <p className="text-sm text-muted">Carregando serviços...</p>}
      {loadError && (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      )}
      {!loading && services.length === 0 && <p className="text-sm text-muted">Nenhum serviço ativo. Crie o primeiro para liberar o link público.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.id}>
            <p className="text-xs uppercase tracking-wide text-muted">{KIND_LABEL[service.kind] ?? service.kind}</p>
            <h3 className="mt-1 text-xl font-semibold">{service.name}</h3>
            <p className="mt-2 text-sm text-muted">{service.duration_minutes} minutos</p>
            <p className="mt-3 text-accent">{service.price_from_label ?? formatMoney(service.price_from_cents)}</p>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="ghost" onClick={() => openEdit(service)}>
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  closeForm();
                  setDeleteError("");
                  setPendingDelete(service);
                }}
              >
                Excluir
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={formMode !== null} title={formMode === "edit" ? "Editar serviço" : "Novo serviço"} onClose={closeForm}>
        <form className="grid gap-4" noValidate onSubmit={onSubmit}>
          <Field
            label="Nome"
            name="name"
            autoFocus
            value={name}
            error={fieldErrors.name}
            placeholder="Sessão — antebraço"
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label htmlFor="service-kind" className="mb-1.5 block text-sm text-muted">
              Tipo
            </label>
            <Select
              id="service-kind"
              value={kind}
              options={KINDS}
              invalid={Boolean(fieldErrors.kind)}
              onChange={(next) => setKind(next as Kind)}
            />
            {fieldErrors.kind && (
              <p role="alert" className="mt-1.5 text-xs text-danger">
                {fieldErrors.kind}
              </p>
            )}
          </div>
          <Field
            label="Duração (minutos)"
            name="duration_minutes"
            type="number"
            inputMode="numeric"
            min={15}
            max={720}
            step={5}
            value={duration}
            error={fieldErrors.duration_minutes}
            onChange={(e) => setDuration(e.target.value)}
          />
          <Field
            label="Preço a partir de"
            name="price"
            inputMode="decimal"
            value={price}
            error={fieldErrors.price_from_cents}
            placeholder="450,00"
            hint="Deixe vazio para aparecer como sob consulta."
            onChange={(e) => setPrice(e.target.value)}
          />
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : formMode === "edit" ? "Salvar alterações" : "Criar serviço"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={pendingDelete !== null} title="Excluir serviço" onClose={closeDelete}>
        <p className="text-sm text-muted">
          {pendingDelete
            ? `${pendingDelete.name} sai da lista e do link público. Horários já marcados com ele continuam na agenda.`
            : ""}
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {deleteError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={closeDelete} disabled={deleting}>
            Cancelar
          </Button>
          <Button type="button" autoFocus onClick={removeService} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
