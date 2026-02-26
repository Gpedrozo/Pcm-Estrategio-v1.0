import { Link } from 'react-router-dom';
import { Crown, Factory, Gauge, Layers3, Settings2, Wrench } from 'lucide-react';
import gppisLogo from '@/assets/gppis-logo.png';

const systems = [
  {
    name: 'PCM Estratégico',
    description: 'Gestão completa de manutenção industrial.',
    href: '/login',
    icon: Factory,
    color: 'bg-primary/10 text-primary border-primary/30',
    available: true,
  },
  {
    name: 'Gestão de Manutenção',
    description: 'Operação técnica e execução de ordens de serviço.',
    href: '/login',
    icon: Wrench,
    color: 'bg-info/10 text-info border-info/30',
    available: true,
  },
  {
    name: 'Indicadores Industriais',
    description: 'Análise de performance e confiabilidade.',
    href: '/login',
    icon: Gauge,
    color: 'bg-success/10 text-success border-success/30',
    available: true,
  },
  {
    name: 'Gestão de Equipamentos',
    description: 'Controle técnico e histórico de ativos.',
    href: '/login',
    icon: Layers3,
    color: 'bg-warning/10 text-warning border-warning/30',
    available: true,
  },
  {
    name: 'Administração',
    description: 'Admin da plataforma: empresas, planos, módulos e usuários.',
    href: '/admin',
    icon: Crown,
    color: 'bg-destructive/10 text-destructive border-destructive/30',
    available: true,
  },
];

export default function SystemPortal() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_55%)]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-10 rounded-2xl border border-border/70 bg-card/70 p-6 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-sidebar-accent flex items-center justify-center border border-border">
                <img src={gppisLogo} alt="GPPIS" className="h-8 w-auto" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">GPPIS Platform</h1>
                <p className="text-muted-foreground text-sm">Selecione um sistema para continuar</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link to="/" className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Site Institucional
              </Link>
              <a href="https://app.gppis.com.br" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90" target="_blank" rel="noreferrer">
                app.gppis.com.br
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {systems.map((system) => (
            <article key={system.name} className="group rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-sm hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-xl transition-all">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border ${system.color}`}>
                <system.icon className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-xl font-semibold">{system.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground min-h-10">{system.description}</p>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {system.available ? 'Disponível' : 'Em breve'}
                </span>

                <Link
                  to={system.href}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Abrir
                  <Settings2 className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
