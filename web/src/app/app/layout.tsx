import { AppShell } from "@/components/app-shell";
import { StaffProvider } from "@/components/staff-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffProvider>
      <AppShell>{children}</AppShell>
    </StaffProvider>
  );
}