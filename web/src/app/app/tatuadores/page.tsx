"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useStaff } from "@/components/staff-context";
import { ASSIGNABLE_ROLES, roleLabel, StaffRole } from "@/lib/roles";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth-store";
import { validateEmail, validatePassword } from "@/lib/validators";
import { cn } from "@/lib/utils";

type Artist = { id: number; name: string; email: string; color: string; role: StaffRole; account_owner?: boolean };

const COLORS = ["#f59e0b", "#e11d48", "#7c3aed", "#0284c7", "#059669", "#db2777", "#ca8a04", "#44403c"];

const emptyForm = { name: "", email: "", password: "", color: COLORS[0], role: "artist" as StaffRole };

function artistNameError(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2) return "Informe o nome.";
  if (name.length > 60) return "O nome está longo demais.";
  if (!/^[\p{L}0-9][\p{L}0-9 .'\-]*$/u.test(name)) return "Use letras no nome.";
  return null;
}

function planLimitCopy(plan: string, limit: number, count: number) {
  const allowance = limit === 1 ? "1 tatuador" : `${limit} tatuadores`;
  const name = plan === "studio" ? "Studio" : "Solo";
  const nextPlan = plan === "studio" ? "Pro" : "Studio ou Pro";
  if (count > limit) {
    return `O plano ${name} inclui ${allowance} e a equipe tem ${count}. Remova alguém ou mude para o ${nextPlan}.`;
  }
  if (limit === 1) {
    return `O plano ${name} já está com o tatuador. Para cadastrar outro, mude para o ${nextPlan}.`;
  }
  return `O plano ${name} já está com os ${allowance}. Para cadastrar outro, mude para o ${nextPlan}.`;
}

export default function ArtistsPage() {
  const toast = useToast();
  const { role: staffRole } = useStaff();
  const canAssign = staffRole === "owner";
  const [artists, setArtists] = useState<Artist[]>([]);
  const [plan, setPlan] = useState("solo");
  const [artistLimit, setArtistLimit] = useState<number | null>(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Artist | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<{ artists: Artist[]; plan?: string; artist_limit?: number | null }>("/api/v1/artists", { token })
      .then((r) => {
        setArtists(r.artists);
        if (r.plan) setPlan(r.plan);
        if ("artist_limit" in r) setArtistLimit(r.artist_limit ?? null);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Não foi possível carregar."))
      .finally(() => setLoading(false));
  }, []);

  const atLimit = artistLimit !== null && artists.length >= artistLimit;

  function openCreate() {
    if (atLimit && artistLimit !== null) {
      toast.error(planLimitCopy(plan, artistLimit, artists.length));
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setFormMode("create");
  }

  function openEdit(artist: Artist) {
    setForm({ name: artist.name, email: artist.email, password: "", color: artist.color, role: artist.role });
    setEditingId(artist.id);
    setFieldErrors({});
    setFormMode("edit");
  }

  function closeForm() {
    if (saving) return;
    setFormMode(null);
  }

  async function saveArtist(event: FormEvent) {
    event.preventDefault();
    const token = getToken();
    if (!token || saving) return;
    if (!editingId && artistLimit !== null && artists.length >= artistLimit) {
      toast.error(planLimitCopy(plan, artistLimit, artists.length));
      setFormMode(null);
      return;
    }
    const next = {
      name: artistNameError(form.name) ?? undefined,
      email: validateEmail(form.email) ?? undefined,
      password: form.password ? (validatePassword(form.password) ?? undefined) : undefined,
    };
    setFieldErrors(next);
    if (next.name || next.email || next.password) return;

    setSaving(true);
    const editing = artists.find((artist) => artist.id === editingId);
    const payload = {
      artist: {
        name: form.name.trim().replace(/\s+/g, " "),
        email: form.email.trim().toLowerCase(),
        color: form.color,
        ...(form.password ? { password: form.password } : {}),
        ...(canAssign && !editing?.account_owner ? { role: form.role } : {}),
      },
    };
    try {
      const saved = await api<{ artist: Artist }>(editingId ? `/api/v1/artists/${editingId}` : "/api/v1/artists", {
        method: editingId ? "PATCH" : "POST",
        token,
        body: JSON.stringify(payload),
      });
      setArtists((current) =>
        [...current.filter((artist) => artist.id !== saved.artist.id), saved.artist].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR")
        )
      );
      setSaving(false);
      setFormMode(null);
      toast.success(editingId ? "Tatuador atualizado" : "Tatuador adicionado", saved.artist.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  async function removeArtist() {
    const token = getToken();
    if (!token || !pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await api(`/api/v1/artists/${pendingDelete.id}`, { method: "DELETE", token });
      setArtists((current) => current.filter((artist) => artist.id !== pendingDelete.id));
      setDeleting(false);
      setPendingDelete(null);
      toast.success("Tatuador removido", pendingDelete.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Tatuadores</h1>
          <p className="mt-1 text-sm text-muted">Quem aparece no link para o cliente escolher. Inclua alguém novo quando entrar na equipe.</p>
          {atLimit && artistLimit !== null && (
            <p className="mt-2 text-sm text-muted">
              {planLimitCopy(plan, artistLimit, artists.length)}{" "}
              {canAssign && (
              <Link href="/app/assinatura" className="text-accent hover:underline">
                Ver planos
              </Link>
              )}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant={atLimit ? "outline" : "primary"}
          onClick={openCreate}
          disabled={atLimit}
          className={atLimit ? "text-muted shadow-none hover:translate-y-0 hover:border-card-border hover:shadow-none disabled:opacity-100" : undefined}
        >
          {atLimit ? "Limite do plano" : "Novo tatuador"}
        </Button>
      </div>

      {loading && <p className="text-sm text-muted">Carregando equipe...</p>}
      {loadError && <p className="text-sm text-danger">{loadError}</p>}
      {!loading && artists.length === 0 && <p className="text-sm text-muted">Nenhum tatuador no link ainda.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {artists.map((artist) => (
          <Card key={artist.id}>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full" style={{ background: artist.color }} />
              <h2 className="text-xl font-semibold">{artist.name}</h2>
            </div>
            <p className="mt-2 text-sm text-muted">{artist.email}</p>
            <p className="mt-1 text-xs text-accent">
              {roleLabel(artist.role)}
              {artist.account_owner ? " · Sua conta" : ""}
            </p>
            <div className="mt-4 flex gap-2">
              {(canAssign || (artist.role === "artist" && !artist.account_owner)) && (
                <Button type="button" variant="ghost" onClick={() => openEdit(artist)}>
                  Editar
                </Button>
              )}
              {canAssign ? !artist.account_owner && (
                <Button type="button" variant="ghost" onClick={() => setPendingDelete(artist)}>
                  Excluir
                </Button>
              ) : artist.role === "artist" && !artist.account_owner && (
                <Button type="button" variant="ghost" onClick={() => setPendingDelete(artist)}>
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Modal open={formMode !== null} title={formMode === "edit" ? "Editar tatuador" : "Novo tatuador"} onClose={closeForm}>
        <form className="space-y-4" noValidate onSubmit={saveArtist}>
          <Field
            label="Nome"
            name="artist-name"
            value={form.name}
            error={fieldErrors.name}
            placeholder="Luna Ink"
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          />
          <Field
            label="E-mail"
            name="artist-email"
            type="email"
            value={form.email}
            error={fieldErrors.email}
            placeholder="luna@estudio.com"
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          />
          <Field
            label={formMode === "edit" ? "Nova senha" : "Senha do painel"}
            name="artist-password"
            type="password"
            value={form.password}
            error={fieldErrors.password}
            placeholder={formMode === "edit" ? "Deixe em branco para manter" : "Opcional"}
            hint={formMode === "create" ? "Opcional. Preencha só se essa pessoa for entrar no painel." : "Opcional."}
            onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
          />
          {canAssign && !artists.find((artist) => artist.id === editingId)?.account_owner && (
            <label className="block text-sm text-muted">
              <span className="mb-1.5 block">Cargo</span>
              <Select
                value={form.role === "owner" ? "artist" : form.role}
                options={ASSIGNABLE_ROLES}
                onChange={(value) => setForm((current) => ({ ...current, role: value as StaffRole }))}
              />
            </label>
          )}
          <div>
            <p className="mb-1.5 text-sm text-muted">Cor na agenda</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${color}`}
                  aria-pressed={form.color === color}
                  className={cn("h-8 w-8 rounded-full border-2", form.color === color ? "border-foreground" : "border-transparent")}
                  style={{ background: color }}
                  onClick={() => setForm((current) => ({ ...current, color }))}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : formMode === "edit" ? "Salvar alterações" : "Criar tatuador"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={pendingDelete !== null} title="Excluir tatuador" onClose={() => { if (!deleting) setPendingDelete(null); }}>
        <p className="text-sm text-muted">
          {pendingDelete
            ? `${pendingDelete.name} sai do link público. Horários já marcados com essa pessoa continuam na agenda.`
            : ""}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button type="button" onClick={removeArtist} disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
