import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarcaInk — Agenda para estúdios de tatuagem",
  description: "Agendamento online, painel do estúdio e assinatura via AbacatePay.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}