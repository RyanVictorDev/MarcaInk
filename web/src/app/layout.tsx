import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarcaInk — Agenda para estúdios de tatuagem",
  description: "Agendamento online, painel do estúdio e assinatura via AbacatePay.",
};

const themeBoot = `(function(){try{var t=localStorage.getItem("marcaink-theme");if(t!=="light"&&t!=="dark")t="dark";var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        {children}
      </body>
    </html>
  );
}