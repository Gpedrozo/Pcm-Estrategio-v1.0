import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, TrendingUp, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Custos() {
  const [os, setOs] = useState<any[]>([]);
  const [execucoes, setExecucoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('ordens_servico').select('*').order('created_at', { ascending: false }),
      supabase.from('execucoes_os').select('*'),
    ]).then(([o, e]) => {
      setOs(o.data || []);
      setExecucoes(e.data || []);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const totalCustoExec = execucoes.reduce((sum, e) => sum + (e.custo_total || 0), 0);
  const totalCustoEst = os.reduce((sum, e) => sum + (e.custo_estimado || 0), 0);

  const custosPorTipo = os.reduce((acc: Record<string, number>, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + (item.custo_estimado || 0);
    return acc;
  }, {});
  const chartData = Object.entries(custosPorTipo).map(([tipo, valor]) => ({ tipo, valor }));
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', '#f59e0b', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Custos de Manutenção</h1><p className="page-subtitle">Análise de custos por tipo e período</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><DollarSign className="h-10 w-10 text-primary" /><div><p className="text-2xl font-bold">R$ {totalCustoEst.toLocaleString('pt-BR')}</p><p className="text-sm text-muted-foreground">Custo Estimado Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><TrendingUp className="h-10 w-10 text-primary" /><div><p className="text-2xl font-bold">R$ {totalCustoExec.toLocaleString('pt-BR')}</p><p className="text-sm text-muted-foreground">Custo Executado Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Wrench className="h-10 w-10 text-primary" /><div><p className="text-2xl font-bold">{os.length}</p><p className="text-sm text-muted-foreground">Total de OS</p></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-industrial"><CardHeader><CardTitle>Custos por Tipo de OS</CardTitle></CardHeader><CardContent>
          {chartData.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="tipo" /><YAxis /><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} /><Bar dataKey="valor" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
        <Card className="card-industrial"><CardHeader><CardTitle>Distribuição por Tipo</CardTitle></CardHeader><CardContent>
          {chartData.length > 0 ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={chartData} dataKey="valor" nameKey="tipo" cx="50%" cy="50%" outerRadius={100} label={({ tipo, percent }) => `${tipo} ${(percent * 100).toFixed(0)}%`}>{chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}
