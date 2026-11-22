import Link from "next/link";
import { ArrowRight, Calendar, CreditCard, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

const plans = [
  { name: "Solo", price: "R$ 69", artists: "1 tatuador", highlight: false },
  { name: "Studio", price: "R$ 129", artists: "Até 5 artistas", highlight: true },
  { name: "Pro", price: "R$ 199", artists: "Equipe ilimitada", highlight: false },
];

export default function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 pb-20 pt-8">
      <header className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <nav className="hidden gap-6 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">
            Recursos
          </a>
          <a href="#pricing" className="hover:text-foreground">
            Planos
          </a>
          <Link href="/s/black-needle" className="hover:text-foreground">
            Demo pública
          </Link>
        </nav>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button>Começar grátis</Button>
          </Link>
        </div>
      </header>

      <section className="mb-24 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-3 py-1 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Feito para estúdios de tatuagem no Brasil
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Sua agenda no automático. Seu Instagram livre para arte.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            MarcaInk une link público de agendamento, painel do estúdio e assinatura recorrente com AbacatePay — Pix e cartão.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg">
                Testar 14 dias <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Entrar no painel
              </Button>
            </Link>
          </div>
        </div>

        <Card className="relative overflow-hidden border-accent/20">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Painel — hoje</p>
          <p className="mt-2 text-3xl font-semibold">6 sessões</p>
          <p className="text-sm text-muted">2 consultas · 3 tatuagens · 1 retoque</p>
          <div className="mt-3 flex w-full items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Link público ativo · /s/seu-studio
          </div>
          <div className="mt-6 space-y-3 border-t border-card-border pt-6">
            {["14:00 — Consulta · Ana", "16:30 — Sessão costas · Luna", "19:00 — Retoque · Bruno"].map((row) => (
              <div key={row} className="flex items-center justify-between rounded-xl bg-black/40 px-4 py-3 text-sm">
                <span>{row}</span>
                <span className="text-accent">confirmado</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="features" className="mb-24 grid gap-6 md:grid-cols-3">
        {[
          { icon: Calendar, title: "Agenda inteligente", text: "Slots por tatuador, serviço e duração real de sessão." },
          { icon: Users, title: "Duas visões", text: "Painel do dono e fluxo público mobile-first para o cliente." },
          { icon: CreditCard, title: "AbacatePay", text: "Assinatura mensal com Pix Automático e cartão recorrente." },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title}>
            <Icon className="mb-3 h-5 w-5 text-accent" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </Card>
        ))}
      </section>

      <section id="pricing" className="mb-12">
        <h2 className="text-3xl font-semibold">Planos simples</h2>
        <p className="mt-2 text-muted">Sem mensalidade no gateway. Você paga só quando o estúdio assina.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlight ? "border-accent/50 shadow-[0_0_40px_-12px_#f59e0b80]" : undefined}
            >
              <p className="text-sm text-muted">{plan.name}</p>
              <p className="mt-2 text-3xl font-semibold">
                {plan.price}
                <span className="text-base font-normal text-muted">/mês</span>
              </p>
              <p className="mt-2 text-sm text-muted">{plan.artists}</p>
              <Link href="/register" className="mt-6 block">
                <Button className="w-full" variant={plan.highlight ? "primary" : "outline"}>
                  Escolher {plan.name}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-card-border pt-8 text-center text-sm text-muted">
        <Link href="/privacidade" className="text-accent hover:underline">
          Política de privacidade
        </Link>
        <p className="mt-2">© {new Date().getFullYear()} MarcaInk</p>
      </footer>
    </div>
  );
}