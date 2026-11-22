import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui/card";

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="mt-8 text-3xl font-semibold">Política de Privacidade (LGPD)</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: novembro de 2026</p>

      <Card className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          O <strong className="text-foreground">MarcaInk</strong> é operado como plataforma de agendamento. Esta política descreve como
          tratamos dados pessoais na aplicação, em conformidade com a Lei nº 13.709/2018 (LGPD).
        </p>
        <section>
          <h2 className="font-medium text-foreground">Dados coletados</h2>
          <p className="mt-2">
            No agendamento público coletamos nome, e-mail, telefone e observações opcionais sobre o projeto. No cadastro do estúdio
            coletamos dados de conta (nome, e-mail, dados do estabelecimento).
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">Finalidade</h2>
          <p className="mt-2">
            Organizar horários, confirmar sessões, comunicar cancelamentos e gerenciar a assinatura do serviço. Não vendemos dados a
            terceiros.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">Base legal</h2>
          <p className="mt-2">
            Execução de contrato e legítimo interesse do estúdio em organizar agenda. O titular pode revogar consentimentos quando
            aplicável.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">Armazenamento e segurança</h2>
          <p className="mt-2">
            Dados ficam na infraestrutura contratada pelo operador do MarcaInk e pelo estúdio usuário. Aplicamos controles de acesso,
            HTTPS em produção e senhas com hash.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">Direitos do titular</h2>
          <p className="mt-2">
            Você pode solicitar acesso, correção, exclusão ou portabilidade entrando em contato com o estúdio onde agendou ou com o
            operador do MarcaInk pelo e-mail de suporte informado na landing.
          </p>
        </section>
        <section>
          <h2 className="font-medium text-foreground">Responsáveis</h2>
          <p className="mt-2">
            O estúdio é controlador dos dados dos clientes agendados. O MarcaInk atua como operador da plataforma, processando dados
            conforme instruções do estúdio.
          </p>
        </section>
      </Card>
    </div>
  );
}