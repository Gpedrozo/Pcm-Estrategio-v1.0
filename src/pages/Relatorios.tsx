import { useState, useEffect, useMemo } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, FileText, Wrench, AlertTriangle, TrendingUp, Clock, DollarSign, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export default function Relatorios() {
  const { fromEmpresa } = useEmpresaQuery();
  const [os, setOs] = useState<any[]>([]);
  const [execucoes, setExecucoes] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fromEmpresa('ordens_servico').order('created_at', { ascending: false }),
      fromEmpresa('execucoes_os'),
      fromEmpresa('equipamentos').eq('ativo', true),
    ]).then(([o, e, eq]) => {
      setOs(o.data || []);
      setExecucoes(e.data || []);
      setEquipamentos(eq.data || []);
      setIsLoading(false);
    });
  }, [fromEmpresa]);

  const data = useMemo(() => {
    const abertas = os.filter(o => o.status !== 'FECHADA').length;
    const fechadas = os.filter(o => o.status === 'FECHADA').length;
    const urgentes = os.filter(o => o.prioridade === 'URGENTE' && o.status !== 'FECHADA').length;
    const custoTotal = execucoes.reduce((s, e) => s + (Number(e.custo_total) || 0), 0);
    const tempoTotal = execucoes.reduce((s, e) => s + (e.tempo_execucao || 0), 0);
    const tempoMedio = execucoes.length > 0 ? Math.round(tempoTotal / execucoes.length) : 0;

    const byStatus = os.reduce((acc: Record<string, number>, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {});
    const byTipo = os.reduce((acc: Record<string, number>, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + 1; return acc; }, {});
    const byPrioridade = os.reduce((acc: Record<string, number>, i) => { acc[i.prioridade] = (acc[i.prioridade] || 0) + 1; return acc; }, {});

    // Tendência mensal
    const months: Record<string, { criadas: number; fechadas: number }> = {};
    os.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
      if (!months[key]) months[key] = { criadas: 0, fechadas: 0 };
      months[key].criadas++;
      if (o.status === 'FECHADA') months[key].fechadas++;
    });

    // Top equipamentos com mais OS
    const eqCount: Record<string, number> = {};
    os.forEach(o => { eqCount[o.tag] = (eqCount[o.tag] || 0) + 1; });
    const topEquip = Object.entries(eqCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

    return {
      abertas, fechadas, urgentes, custoTotal, tempoMedio, total: os.length,
      statusData: Object.entries(byStatus).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
      tipoData: Object.entries(byTipo).map(([name, value]) => ({ name, value })),
      prioData: Object.entries(byPrioridade).map(([name, value]) => ({ name, value })),
      tendencia: Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([mes, v]) => ({ mes, ...v })),
      topEquip,
      taxaFechamento: os.length > 0 ? ((fechadas / os.length) * 100).toFixed(0) : '0',
    };
  }, [os, execucoes]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Relatórios</h1><p className="page-subtitle">Relatórios gerenciais e operacionais</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { icon: FileText, label: 'Total OS', value: data.total, color: 'text-primary' },
          { icon: AlertTriangle, label: 'Abertas', value: data.abertas, color: 'text-warning' },
          { icon: Wrench, label: 'Fechadas', value: data.fechadas, color: 'text-success' },
          { icon: Target, label: 'Urgentes', value: data.urgentes, color: 'text-destructive' },
          { icon: BarChart3, label: 'Taxa Fech.', value: `${data.taxaFechamento}%`, color: 'text-primary' },
          { icon: Clock, label: 'Tempo Médio', value: `${data.tempoMedio}m`, color: 'text-info' },
          { icon: DollarSign, label: 'Custo Total', value: formatCurrency(data.custoTotal), color: 'text-success' },
        ].map(k => (
          <Card key={k.label} className="card-industrial"><CardContent className="p-3">
            <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
            <p className="text-lg font-bold font-mono">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="tendencias">Tendências</TabsTrigger>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">OS por Status</CardTitle></CardHeader><CardContent>
              {data.statusData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={data.statusData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
            </CardContent></Card>
            <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">OS por Tipo</CardTitle></CardHeader><CardContent>
              {data.tipoData.length > 0 ? <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={data.tipoData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{data.tipoData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
            </CardContent></Card>
            <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">OS por Prioridade</CardTitle></CardHeader><CardContent>
              {data.prioData.length > 0 ? <ResponsiveContainer width="100%" height={260}><BarChart data={data.prioData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{data.prioData.map((e, i) => <Cell key={i} fill={e.name === 'URGENTE' ? 'hsl(var(--destructive))' : e.name === 'ALTA' ? 'hsl(var(--warning))' : COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Tendência Mensal — Criadas vs Fechadas</CardTitle></CardHeader><CardContent>
            {data.tendencia.length > 0 ? <ResponsiveContainer width="100%" height={300}><AreaChart data={data.tendencia}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend /><Area type="monotone" dataKey="criadas" name="Criadas" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.15} strokeWidth={2} /><Area type="monotone" dataKey="fechadas" name="Fechadas" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="equipamentos" className="space-y-6">
          <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Top 10 Equipamentos com mais OS</CardTitle></CardHeader><CardContent>
            {data.topEquip.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={data.topEquip} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="tag" type="category" width={100} tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" name="OS" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
