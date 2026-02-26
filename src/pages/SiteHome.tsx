import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Cog,
  Factory,
  LineChart,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import gppisLogo from '@/assets/gppis-logo.png';

const systems = [
  {
    title: 'PCM Estratégico',
    description: 'Gestão completa de manutenção com ordens, histórico e indicadores.',
    icon: Factory,
  },
  {
    title: 'Sistema de Lubrificação',
    description: 'Padronização de rotinas e execução técnica da lubrificação industrial.',
    icon: Cog,
  },
  {
    title: 'Gestão de Manutenção',
    description: 'Fluxo operacional de O.S, backlog e execução técnica em campo.',
    icon: Wrench,
  },
  {
    title: 'Indicadores Industriais',
    description: 'KPIs de performance, custos e confiabilidade para decisão gerencial.',
    icon: BarChart3,
  },
];

const problems = [
  'Ordens de serviço sem rastreabilidade completa',
  'Falhas recorrentes por falta de histórico técnico',
  'Dificuldade para medir custos e desempenho da manutenção',
];

const benefits = [
  'Redução de falhas',
  'Maior disponibilidade dos ativos',
  'Menor custo de manutenção',
  'Decisão baseada em dados',
];

export default function SiteHome() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.98),rgba(15,23,42,0.95),rgba(30,58,138,0.45))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:46px_46px]" />
        <motion.div
          className="absolute h-2 w-2 rounded-full bg-orange-400/50"
          initial={{ x: 80, y: 120, opacity: 0.2 }}
          animate={{ x: 260, y: 80, opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' }}
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28 grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-wide text-slate-200 backdrop-blur-sm">
              <img src={gppisLogo} alt="GPPIS" className="h-5 w-auto" />
              GPP Industrial Systems
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-white"
            >
              Sistema profissional de gestão de manutenção industrial
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-200 max-w-2xl"
            >
              Controle ordens de serviço, máquinas, histórico e indicadores em um único sistema.
            </motion.p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/acessar"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Acessar Sistemas
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sistemas"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-5 py-3 font-medium text-white hover:bg-white/15 transition-colors"
              >
                Conhecer Plataforma
              </Link>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/20 bg-black/30 p-5 backdrop-blur-md shadow-2xl"
          >
            <p className="text-xs uppercase tracking-wide text-slate-300 mb-4">Dashboard Operacional</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">OS Abertas</p>
                <p className="text-2xl font-bold text-orange-400">24</p>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3">
                <p className="text-xs text-slate-400">Eficiência</p>
                <p className="text-2xl font-bold text-sky-400">93%</p>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 p-3 col-span-2">
                <p className="text-xs text-slate-400">Indicadores Industriais</p>
                <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-sky-500 to-orange-400" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">Problemas da Indústria</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {problems.map((text) => (
            <article key={text} className="rounded-xl border border-border bg-card p-5">
              <AlertTriangle className="h-5 w-5 text-orange-500 mb-3" />
              <p className="text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold">A Solução GPPIS</h2>
          <p className="text-muted-foreground mt-3 max-w-4xl">
            Plataforma profissional com arquitetura industrial para centralizar manutenção, padronizar execução e gerar inteligência operacional em tempo real.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <ShieldCheck className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm">Controle e governança técnica</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <LineChart className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm">Indicadores para decisão rápida</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Building2 className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm">Escalável para múltiplas empresas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold">Benefícios</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <div key={item} className="rounded-lg border border-border bg-card p-4 text-sm font-medium">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14" id="sistemas">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Sistemas</h2>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Acesso rápido às soluções da plataforma industrial GPPIS.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {systems.map((system) => (
            <article key={system.title} className="rounded-xl border border-border bg-card/70 p-5 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg transition-all">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <system.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{system.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground min-h-14">{system.description}</p>
              <div className="mt-4">
                <Link to="/acessar" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
                  Acessar sistema
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 border-t border-border">
        <h2 className="text-2xl md:text-3xl font-bold">Sobre a Empresa</h2>
        <p className="text-muted-foreground mt-3 max-w-4xl">
          A <strong>GPP Industrial Systems (GPPIS)</strong>, fundada por <strong>Gustavo Pedrozo Pinto</strong>, é especializada em tecnologia industrial, gestão de manutenção e sistemas empresariais.
        </p>
      </section>

      <section id="contato" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-bold">Contato Comercial</h2>
          <p className="text-muted-foreground mt-2">Fale com o time da GPPIS para implantar a plataforma na sua operação.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Email</p>
              <p className="font-medium mt-1">pedrozo@gppis.com.br</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Website</p>
              <p className="font-medium mt-1">www.gppis.com.br</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">WhatsApp</p>
              <p className="font-medium mt-1">+55 46 99110-6129</p>
            </div>
          </div>
          <a
            href="https://wa.me/5546991106129"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90"
          >
            <Phone className="h-4 w-4" />
            Falar no WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © 2026 GPP Industrial Systems
      </footer>
    </div>
  );
}
