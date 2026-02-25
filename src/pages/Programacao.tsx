import { useState, useEffect, useMemo } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarClock, AlertTriangle, CheckCircle2, Clock, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--info))'];

export default function Programacao() {
  const { fromEmpresa } = useEmpresaQuery();
  const [planos, setPlanos] = useState<any[]>([]);
  const [lubrificacao, setLubrificacao] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    Promise.all([
      fromEmpresa('planos_preventivos').eq('ativo', true).order('proxima_execucao'),
      fromEmpresa('lubrificacao').eq('ativo', true).order('proxima_execucao'),
    ]).then(([p, l]) => { setPlanos(p.data || []); setLubrificacao(l.data || []); setIsLoading(false); });
  }, [fromEmpresa]);

  const isOverdue = (d: string) => new Date(d) < new Date();

  const allItems = useMemo(() => {
    let items = [
      ...planos.map(p => ({ ...p, _tipo: 'Preventiva', _nome: p.nome })),
      ...lubrificacao.map(l => ({ ...l, _tipo: 'Lubrificação', _nome: l.ponto })),
    ].sort((a, b) => new Date(a.proxima_execucao).getTime() - new Date(b.proxima_execucao).getTime());

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(i => i.tag?.toLowerCase().includes(s) || i.equipamento?.toLowerCase().includes(s) || i._nome?.toLowerCase().includes(s));
    }
    if (filterTipo !== 'all') items = items.filter(i => i._tipo === filterTipo);
    if (filterStatus === 'atrasada') items = items.filter(i => isOverdue(i.proxima_execucao));
    if (filterStatus === 'no_prazo') items = items.filter(i => !isOverdue(i.proxima_execucao));
    return items;
  }, [planos, lubrificacao, search, filterTipo, filterStatus]);

  const stats = useMemo(() => {
    const all = [...planos.map(p => ({ ...p, _tipo: 'Preventiva' })), ...lubrificacao.map(l => ({ ...l, _tipo: 'Lubrificação' }))];
    const atrasadas = all.filter(i => isOverdue(i.proxima_execucao)).length;
    const noPrazo = all.length - atrasadas;

    // Por periodicidade
    const byPeriod: Record<string, number> = {};
    all.forEach(i => { byPeriod[i.periodicidade] = (byPeriod[i.periodicidade] || 0) + 1; });

    return {
      total: all.length,
      preventivos: planos.length,
      lubrificacoes: lubrificacao.length,
      atrasadas,
      noPrazo,
      tipoChart: [{ name: 'Preventiva', value: planos.length }, { name: 'Lubrificação', value: lubrificacao.length }].filter(d => d.value > 0),
      periodChart: Object.entries(byPeriod).map(([name, value]) => ({ name, value })),
    };
  }, [planos, lubrificacao]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Programação</h1><p className="page-subtitle">Calendário de manutenção programada — {stats.total} atividades</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: CalendarClock, label: 'Total', value: stats.total, color: 'text-primary' },
          { icon: CheckCircle2, label: 'Preventivos', value: stats.preventivos, color: 'text-success' },
          { icon: Clock, label: 'Lubrificações', value: stats.lubrificacoes, color: 'text-info' },
          { icon: CheckCircle2, label: 'No Prazo', value: stats.noPrazo, color: 'text-success' },
          { icon: AlertTriangle, label: 'Atrasadas', value: stats.atrasadas, color: 'text-destructive' },
        ].map(k => (
          <Card key={k.label} className="card-industrial"><CardContent className="p-3">
            <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
            <p className="text-xl font-bold font-mono">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      {stats.atrasadas > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm font-medium text-destructive">{stats.atrasadas} atividade(s) atrasada(s) — requerem atenção imediata</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Distribuição por Tipo</CardTitle></CardHeader><CardContent>
          {stats.tipoChart.length > 0 ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={stats.tipoChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{stats.tipoChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
        <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Por Periodicidade</CardTitle></CardHeader><CardContent>
          {stats.periodChart.length > 0 ? <ResponsiveContainer width="100%" height={220}><BarChart data={stats.periodChart}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar TAG, equipamento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={filterTipo} onValueChange={setFilterTipo}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="Preventiva">Preventiva</SelectItem><SelectItem value="Lubrificação">Lubrificação</SelectItem></SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos status</SelectItem><SelectItem value="atrasada">Atrasadas</SelectItem><SelectItem value="no_prazo">No prazo</SelectItem></SelectContent></Select>
      </div>

      <Card className="card-industrial"><CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Próximas Atividades ({allItems.length})</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Tipo</th><th>TAG</th><th>Equipamento</th><th>Atividade</th><th>Periodicidade</th><th>Próxima Execução</th><th>Status</th></tr></thead><tbody>
        {allItems.map(e => (<tr key={e.id}><td><Badge variant="outline">{e._tipo}</Badge></td><td className="font-mono font-medium">{e.tag}</td><td>{e.equipamento}</td><td>{e._nome}</td><td>{e.periodicidade}</td><td>{new Date(e.proxima_execucao).toLocaleDateString('pt-BR')}</td><td><Badge variant={isOverdue(e.proxima_execucao) ? 'destructive' : 'default'}>{isOverdue(e.proxima_execucao) ? 'Atrasada' : 'No prazo'}</Badge></td></tr>))}
        {allItems.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma atividade encontrada</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
