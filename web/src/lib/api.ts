function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (!raw || raw === "same-origin") return "";
  return raw;
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;
  constructor(message: string, status: number, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Erro na requisição", res.status, data.fields);
  }
  return data as T;
}

function publicStudioPath(slug: string, suffix = "") {
  const safe = encodeURIComponent(slug.trim());
  return `/api/v1/public/studios/${safe}${suffix}`;
}

export const publicApi = {
  studio: (slug: string) => api<PublicStudioResponse>(publicStudioPath(slug)),
  slots: (slug: string, q: Record<string, string>) =>
    api<{ slots: Slot[] }>(`${publicStudioPath(slug)}/slots?${new URLSearchParams(q)}`),
  book: (slug: string, body: unknown) =>
    api<{ appointment: BookedAppointment }>(`${publicStudioPath(slug)}/book`, {
      method: "POST",
      body: JSON.stringify({ booking: body }),
    }),
};

export type Slot = { starts_at: string; ends_at: string; label: string };
export type BookedAppointment = { id: number; starts_at: string; ends_at: string; cancel_token: string; studio_name: string };

export type PublicStudioResponse = {
  studio: { name: string; slug: string; address?: string; phone?: string; instagram?: string; cancellation_policy?: string };
  services: { id: number; name: string; kind: string; duration_minutes: number; price_from_cents: number }[];
  artists: { id: number; name: string; color: string }[];
};

export type AuthResponse = {
  token: string;
  user: { id: number; name: string; email: string; role: string };
  studio: Studio;
};

export type Studio = {
  id: number;
  name: string;
  slug: string;
  phone?: string;
  address?: string;
  instagram?: string;
  subscription_status: string;
  plan: string;
  trial_ends_at?: string;
  subscription_active?: boolean;
  cancellation_policy?: string;
};

export type DashboardData = {
  today_count: number;
  week_count: number;
  upcoming: {
    id: number;
    starts_at: string;
    customer_name: string;
    service: string;
    artist: string;
    status: string;
  }[];
  public_booking_url: string;
  cancellation_rate: number;
};