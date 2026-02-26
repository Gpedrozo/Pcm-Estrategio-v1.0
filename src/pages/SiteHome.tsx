import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Cog, BarChart3, Wrench, Factory, PlayCircle } from 'lucide-react';
import gppisLogo from '@/assets/gppis-logo.png';

const systems = [
  {
    title: 'PCM Estratégico',
    description: 'Gestão completa de manutenção com indicadores e planejamento técnico.',
    icon: Factory,
  },
  {
    title: 'Gestão de Manutenção',
    description: 'Fluxo operacional de O.S, backlog e execução padronizada.',
    icon: Wrench,
  },
  {
    title: 'Planejamento de Manutenção',
    description: 'Rotinas preventivas, preditivas e programação por criticidade.',
    icon: Cog,
  },
  {
    title: 'Controle de Equipamentos',
    description: 'Estrutura técnica, histórico e documentação centralizada.',
    icon: Building2,
  },
  {
    title: 'Indicadores Industriais',
    description: 'KPIs de desempenho, custos e confiabilidade operacional.',
    icon: BarChart3,
  },
];

export default function SiteHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
              <img src={gppisLogo} alt="GPPIS" className="h-5 w-auto" />
              Soluções Inteligentes para Manutenção Industrial
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Engenharia Digital para o
              <span className="text-primary"> Chão de Fábrica</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl">
              Plataforma SaaS da GPPIS para manutenção industrial, gestão técnica e tomada de decisão com dados reais.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/portal" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Ver Sistemas
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contato" className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 font-medium hover:bg-accent transition-colors">
                Solicitar Demonstração
              </a>
              <Link to="/portal" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 font-medium hover:bg-accent transition-colors">
                Acessar Plataforma
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Sobre a GPPIS</h2>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Empresa especializada em sistemas para manutenção industrial, com foco em confiabilidade, produtividade e gestão orientada por indicadores.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {systems.map((system) => (
            <article key={system.title} className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <system.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{system.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground min-h-12">{system.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
                  Saiba Mais
                </button>
                <button className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors">
                  <PlayCircle className="h-4 w-4" />
                  Demonstração
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contato" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-bold">Contato Comercial</h2>
          <p className="text-muted-foreground mt-2">Fale com o time da GPPIS para implantar a plataforma na sua operação.</p>
          <form className="mt-6 grid gap-3 md:grid-cols-2">
            <input className="h-11 rounded-md border border-border bg-background px-3" placeholder="Nome" />
            <input className="h-11 rounded-md border border-border bg-background px-3" placeholder="Empresa" />
            <input className="h-11 rounded-md border border-border bg-background px-3 md:col-span-2" placeholder="Email" />
            <textarea className="min-h-28 rounded-md border border-border bg-background px-3 py-2 md:col-span-2" placeholder="Como podemos ajudar?" />
            <button type="button" className="md:col-span-2 inline-flex justify-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
              Enviar para Comercial
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
