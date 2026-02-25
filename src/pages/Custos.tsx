import { useState, useEffect, useMemo } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, TrendingUp, Wrench, TrendingDown, Users, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--info))'];

export default function Custos() {
  const { fromEmpresa } = useEmpresaQuery();
  const [os, setOs] = useState<any[]>([]);
  const [execucoes, setExecucoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fromEmpresa('ordens_servico').order('created_at', { ascending: false }),
      fromEmpresa('execucoes_os'),
    ]).then(([o, e]) => { setOs(o.data || []); setExecucoes(e.data || []); setIsLoading(false); });
  }, [fromEmpresa]);

  const data = useMemo(() => {
    const totalCustoExec = execucoes.reduce((sum, e) => sum + (Number(e.custo_total) || 0), 0);
    const totalCustoEst = os.reduce((sum, e) => sum + (Number(e.custo_estimado) || 0), 0);
    const custoMO = execucoes.reduce((sum, e) => sum + (Number(e.custo_mao_obra) || 0), 0);
    const custoMat = execucoes.reduce((sum, e) => sum + (Number(e.custo_materiais) || 0), 0);
    const custoTerc = execucoes.reduce((sum, e) => sum + (Number(e.custo_terceiros) || 0), 0);
    const variacao = totalCustoEst > 0 ? (((totalCustoExec - totalCustoEst) / totalCustoEst) * 100) : 0;

    const custosPorTipo = os.reduce((acc: Record<string, { est: number; exec: number }>, item) => {
      if (!acc[item.tipo]) acc[item.tipo] = { est: 0, exec: 0 };
      acc[item.tipo].est += Number(item.custo_estimado) || 0;
      return acc;
    }, {});
    execucoes.forEach(e => {
      const osItem = os.find(o => o.id === e.os_id);
      if (osItem && custosPorTipo[osItem.tipo]) custosPorTipo[osItem.tipo].exec += Number(e.custo_total) || 0;
    });
    const chartTipo = Object.entries(custosPorTipo).map(([tipo, v]) => ({ tipo, estimado: (v as any).est, executado: (v as any).exec }));

    const breakdown = [
      { name: 'Mão de Obra', value: custoMO },
      { name: 'Materiais', value: custoMat },
      { name: 'Terceiros', value: custoTerc },
    ].filter(d => d.value > 0);

    // Tendência mensal de custos
    const months: Record<string, number> = {};
    execucoes.forEach(e => {
      const d = new Date(e.created_at);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
      months[key] = (months[key] || 0) + (Number(e.custo_total) || 0);
    });
    const tendencia = Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([mes, custo]) => ({ mes, custo }));

    return { totalCustoExec, totalCustoEst, custoMO, custoMat, custoTerc, variacao, chartTipo, breakdown, tendencia };
  }, [os, execucoes]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Custos de Manutenção</h1><p className="page-subtitle">Análise de custos por tipo e período</p></div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: DollarSign, label: 'Custo Estimado', value: fmt(data.totalCustoEst), color: 'text-primary' },
          { icon: TrendingUp, label: 'Custo Executado', value: fmt(data.totalCustoExec), color: 'text-success' },
          { icon: data.variacao > 0 ? TrendingUp : TrendingDown, label: 'Variação', value: `${data.variacao > 0 ? '+' : ''}${data.variacao.toFixed(1)}%`, color: data.variacao > 5 ? 'text-destructive' : 'text-success' },
          { icon: Users, label: 'Mão de Obra', value: fmt(data.custoMO), color: 'text-info' },
          { icon: Package, label: 'Materiais', value: fmt(data.custoMat), color: 'text-warning' },
          { icon: Wrench, label: 'Terceiros', value: fmt(data.custoTerc), color: 'text-muted-foreground' },
        ].map(k => (
          <Card key={k.label} className="card-industrial"><CardContent className="p-3">
            <k.icon className={`h-4 w-4 ${k.color} mb-1`} />
            <p className="text-lg font-bold font-mono">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-industrial lg:col-span-2"><CardHeader><CardTitle className="text-sm">Custo Estimado vs Executado por Tipo</CardTitle></CardHeader><CardContent>
          {data.chartTipo.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={data.chartTipo}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="tipo" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v: number) => fmt(v)} /><Legend /><Bar dataKey="estimado" name="Estimado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /><Bar dataKey="executado" name="Executado" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>

        <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Distribuição de Custos</CardTitle></CardHeader><CardContent>
          {data.breakdown.length > 0 ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data.breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{data.breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => fmt(v)} /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
      </div>

      <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Tendência Mensal de Custos</CardTitle></CardHeader><CardContent>
        {data.tendencia.length > 0 ? <ResponsiveContainer width="100%" height={280}><AreaChart data={data.tendencia}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="mes" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v: number) => fmt(v)} /><Area type="monotone" dataKey="custo" name="Custo" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} /></AreaChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
      </CardContent></Card>
    </div>
  );
}
