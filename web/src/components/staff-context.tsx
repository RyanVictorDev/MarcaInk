"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api, Studio } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth-store";
import { asRole, StaffRole } from "@/lib/roles";

type StaffUser = { id: number; name: string; email: string; role: StaffRole };

type StaffState = {
  user: StaffUser;
  studio: Studio;
  role: StaffRole;
};

const StaffContext = createContext<StaffState | null>(null);

export function StaffProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<StaffState | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api<{ user: StaffUser; studio: Studio }>("/api/v1/auth/me", { token })
      .then((response) => {
        setState({
          user: { ...response.user, role: asRole(response.user.role) },
          studio: response.studio,
          role: asRole(response.user.role),
        });
      })
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [router]);

  if (!state) {
    return <p className="p-6 text-sm text-muted">Carregando painel...</p>;
  }

  return <StaffContext.Provider value={state}>{children}</StaffContext.Provider>;
}

export function useStaff() {
  const state = useContext(StaffContext);
  if (!state) throw new Error("useStaff precisa do painel");
  return state;
}
