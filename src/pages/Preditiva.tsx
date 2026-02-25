import { useState, useEffect, useMemo } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Activity, TrendingUp, AlertTriangle, Search, Gauge, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--info))'];

export default function Preditiva() {
  const { fromEmpresa } = useEmpresaQuery();
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [os, setOs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fromEmpresa('equipamentos').eq('ativo', true).order('tag'),
      fromEmpresa('ordens_servico').eq('tipo', 'PREDITIVA').order('created_at', { ascending: false }).limit(50),
    ]).then(([e, o]) => { setEquipamentos(e.data || []); setOs(o.data || []); setIsLoading(false); });
  }, [fromEmpresa]);

  const stats = useMemo(() => {
    const criticos = equipamentos.filter(e => e.criticidade === 'A');
    const altoRisco = equipamentos.filter(e => e.nivel_risco === 'CRITICO' || e.nivel_risco === 'ALTO');
    const osAbertas = os.filter(o => o.status !== 'FECHADA').length;
    const osFechadas = os.filter(o => o.status === 'FECHADA').length;

    const byCrit: Record<string, number> = {};
    equipamentos.forEach(e => { byCrit[e.criticidade] = (byCrit[e.criticidade] || 0) + 1; });
    const byRisco: Record<string, number> = {};
    equipamentos.forEach(e => { byRisco[e.nivel_risco] = (byRisco[e.nivel_risco] || 0) + 1; });

    return {
      total: equipamentos.length, criticos: criticos.length, altoRisco: altoRisco.length,
      osTotal: os.length, osAbertas, osFechadas,
      critChart: Object.entries(byCrit).map(([name, value]) => ({ name, value })),
      riscoChart: Object.entries(byRisco).map(([name, value]) => ({ name, value })),
    };
  }, [equipamentos, os]);

  const filteredCriticos = useMemo(() => {
    let items = equipamentos.filter(e => e.criticidade === 'A' || e.nivel_risco === 'CRITICO' || e.nivel_risco === 'ALTO');
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(e => e.tag.toLowerCase().includes(s) || e.nome.toLowerCase().includes(s));
    }
    return items;
  }, [equipamentos, search]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Manutenção Preditiva</h1><p className="page-subtitle">Monitoramento e análises preditivas</p></div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Activity, label: 'Equipamentos', value: stats.total, color: 'text-primary' },
          { icon: AlertTriangle, label: 'Críticos (A)', value: stats.criticos, color: 'text-destructive' },
          { icon: Shield, label: 'Alto Risco', value: stats.altoRisco, color: 'text-warning' },
          { icon: TrendingUp, label: 'OS Preditivas', value: stats.osTotal, color: 'text-info' },
          { icon: Gauge, label: 'OS Abertas', value: stats.osAbertas, color: 'text-warning' },
          { icon: Gauge, label: 'OS Fechadas', value: stats.osFechadas, color: 'text-success' },
        ].map(k => (
          <Card key={k.label} className="card-industrial"><CardContent className="p-3">
            <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
            <p className="text-xl font-bold font-mono">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Equipamentos por Criticidade</CardTitle></CardHeader><CardContent>
          {stats.critChart.length > 0 ? <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={stats.critChart} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{stats.critChart.map((e, i) => <Cell key={i} fill={e.name === 'A' ? 'hsl(var(--destructive))' : e.name === 'B' ? 'hsl(var(--warning))' : 'hsl(var(--success))'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
        <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Equipamentos por Nível de Risco</CardTitle></CardHeader><CardContent>
          {stats.riscoChart.length > 0 ? <ResponsiveContainer width="100%" height={220}><BarChart data={stats.riscoChart}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{stats.riscoChart.map((e, i) => <Cell key={i} fill={e.name === 'CRITICO' ? 'hsl(var(--destructive))' : e.name === 'ALTO' ? 'hsl(var(--warning))' : e.name === 'MEDIO' ? 'hsl(var(--info))' : 'hsl(var(--success))'} />)}</Bar></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar ativos críticos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>

      <Card className="card-industrial"><CardHeader><CardTitle>Ativos Críticos para Monitoramento ({filteredCriticos.length})</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Nome</th><th>Criticidade</th><th>Risco</th><th>Localização</th><th>Fabricante</th></tr></thead><tbody>
        {filteredCriticos.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.nome}</td><td><Badge variant="destructive">{e.criticidade}</Badge></td><td><Badge variant={e.nivel_risco === 'CRITICO' ? 'destructive' : e.nivel_risco === 'ALTO' ? 'default' : 'secondary'}>{e.nivel_risco}</Badge></td><td>{e.localizacao || '-'}</td><td>{e.fabricante || '-'}</td></tr>))}
        {filteredCriticos.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum ativo crítico encontrado</td></tr>}
      </tbody></table></div></CardContent></Card>

      {os.length > 0 && (
        <Card className="card-industrial"><CardHeader><CardTitle>Últimas OS Preditivas</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>OS</th><th>TAG</th><th>Equipamento</th><th>Problema</th><th>Prioridade</th><th>Status</th><th>Data</th></tr></thead><tbody>
          {os.slice(0, 15).map(e => (<tr key={e.id}><td className="font-mono font-medium">#{e.numero_os}</td><td className="font-mono text-primary">{e.tag}</td><td>{e.equipamento}</td><td className="max-w-[200px] truncate">{e.problema}</td><td><Badge variant={e.prioridade === 'URGENTE' ? 'destructive' : 'secondary'}>{e.prioridade}</Badge></td><td><Badge variant="outline">{e.status?.replace(/_/g, ' ')}</Badge></td><td className="text-muted-foreground">{new Date(e.data_solicitacao).toLocaleDateString('pt-BR')}</td></tr>))}
        </tbody></table></div></CardContent></Card>
      )}
    </div>
  );
}
