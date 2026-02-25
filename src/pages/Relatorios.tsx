import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, FileText, Wrench, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Relatorios() {
  const { fromEmpresa } = useEmpresaQuery();
  const [os, setOs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fromEmpresa('ordens_servico').order('created_at', { ascending: false }).then(({ data }) => { setOs(data || []); setIsLoading(false); });
  }, [fromEmpresa]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const byStatus = os.reduce((acc: Record<string, number>, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {});
  const byTipo = os.reduce((acc: Record<string, number>, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + 1; return acc; }, {});
  const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  const tipoData = Object.entries(byTipo).map(([name, value]) => ({ name, value }));
  const abertas = os.filter(o => o.status !== 'FECHADA').length;
  const fechadas = os.filter(o => o.status === 'FECHADA').length;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Relatórios</h1><p className="page-subtitle">Relatórios gerenciais e operacionais</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><FileText className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{os.length}</p><p className="text-sm text-muted-foreground">Total OS</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><AlertTriangle className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{abertas}</p><p className="text-sm text-muted-foreground">Abertas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Wrench className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{fechadas}</p><p className="text-sm text-muted-foreground">Fechadas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{os.length > 0 ? ((fechadas / os.length) * 100).toFixed(0) : 0}%</p><p className="text-sm text-muted-foreground">Taxa Fechamento</p></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-industrial"><CardHeader><CardTitle>OS por Status</CardTitle></CardHeader><CardContent>
          {statusData.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={statusData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
        <Card className="card-industrial"><CardHeader><CardTitle>OS por Tipo</CardTitle></CardHeader><CardContent>
          {tipoData.length > 0 ? <ResponsiveContainer width="100%" height={300}><BarChart data={tipoData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--destructive))" /></BarChart></ResponsiveContainer> : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}
