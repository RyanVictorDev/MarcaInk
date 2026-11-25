export type StaffRole = "owner" | "lead" | "artist";

export const ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Dono",
  lead: "Tatuador responsável",
  artist: "Tatuador",
};

export const ASSIGNABLE_ROLES: { value: Exclude<StaffRole, "owner">; label: string }[] = [
  { value: "lead", label: "Tatuador responsável" },
  { value: "artist", label: "Tatuador" },
];

const NAV: Record<StaffRole, string[]> = {
  owner: ["/app", "/app/agenda", "/app/servicos", "/app/tatuadores", "/app/assinatura", "/app/config"],
  lead: ["/app", "/app/agenda", "/app/servicos", "/app/tatuadores", "/app/config"],
  artist: ["/app", "/app/agenda", "/app/config"],
};

export function asRole(value: string | null | undefined): StaffRole {
  if (value === "owner" || value === "lead" || value === "artist") return value;
  return "artist";
}

export function roleLabel(role: string) {
  return ROLE_LABEL[asRole(role)];
}

export function allowedHrefs(role: StaffRole) {
  return NAV[role];
}
