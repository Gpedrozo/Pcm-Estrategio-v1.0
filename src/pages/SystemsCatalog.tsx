import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Factory, Gauge, Wrench } from 'lucide-react';
import { motion } from 'framer-motion';

const cards = [
  {
    title: 'PCM Estratégico',
    subtitle: 'Gestão de Manutenção Industrial',
    description: 'Planejamento, execução e auditoria da manutenção em um único ambiente.',
    icon: Factory,
  },
  {
    title: 'Sistema de Lubrificação',
    subtitle: 'Rotinas e periodicidade',
    description: 'Controle técnico de pontos de lubrificação com padronização operacional.',
    icon: Activity,
  },
  {
    title: 'Gestão de Manutenção',
    subtitle: 'Operação diária',
    description: 'Fluxo de ordens de serviço, backlog e fechamento técnico com rastreabilidade.',
    icon: Wrench,
  },
  {
    title: 'Indicadores Industriais',
    subtitle: 'Performance e confiabilidade',
    description: 'KPIs operacionais, custos e insights para tomada de decisão.',
    icon: Gauge,
  },
];

export default function SystemsCatalog() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(2,6,23,0.95),rgba(17,24,39,0.9),rgba(30,58,138,0.35))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-white">
            Conheça a Plataforma GPPIS
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-200 mt-4 max-w-3xl">
            Soluções modulares para manutenção industrial, gestão técnica e inteligência operacional.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 flex gap-3">
            <Link to="/acessar" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-primary-foreground font-medium">
              Acessar Sistema
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-white">
              Voltar ao Site
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 grid gap-5 md:grid-cols-2">
        {cards.map((item, idx) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.subtitle}</p>
            <h2 className="text-xl font-semibold mt-1">{item.title}</h2>
            <p className="text-sm text-muted-foreground mt-3">{item.description}</p>
            <Link to="/acessar" className="inline-flex items-center gap-2 text-sm text-primary mt-4 hover:underline">
              Acessar sistema
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.article>
        ))}
      </section>
    </main>
  );
}
