import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart3, AlertTriangle, TrendingUp, Wrench } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(199,89%,48%)', 'hsl(142,72%,29%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(213,56%,24%)'];

export default function AdminMetricas() {
  const [isLoading, setIsLoading] = useState(true);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('all');
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    supabase.from('empresas').select('id, nome').order('nome').then(({ data }) => setEmpresas(data || []));
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [selectedEmpresa]);

  async function loadMetrics() {
    setIsLoading(true);
    let osQuery = supabase.from('ordens_servico').select('*');
    let eqQuery = supabase.from('equipamentos').select('*');
    let execQuery = supabase.from('execucoes_os').select('*');

    if (selectedEmpresa !== 'all') {
      osQuery = osQuery.eq('empresa_id', selectedEmpresa);
      eqQuery = eqQuery.eq('empresa_id', selectedEmpresa);
      execQuery = execQuery.eq('empresa_id', selectedEmpresa);
    }

    const [osRes, eqRes, execRes] = await Promise.all([osQuery, eqQuery, execQuery]);
    const os = osRes.data || [];
    const eq = eqRes.data || [];
    const exec = execRes.data || [];

    // Métricas
    const totalOS = os.length;
    const abertas = os.filter(o => o.status !== 'FECHADA').length;
    const fechadas = os.filter(o => o.status === 'FECHADA').length;
    const urgentes = os.filter(o => o.prioridade === 'URGENTE' && o.status !== 'FECHADA').length;
    const corretivas = os.filter(o => o.tipo === 'CORRETIVA').length;
    const preventivas = os.filter(o => o.tipo === 'PREVENTIVA').length;
    const ratioPrevCorr = corretivas > 0 ? (preventivas / corretivas).toFixed(2) : 'N/A';

    // Custos
    const custoTotal = exec.reduce((s, e) => s + (Number(e.custo_total) || 0), 0);
    const custoMO = exec.reduce((s, e) => s + (Number(e.custo_mao_obra) || 0), 0);
    const custoMat = exec.reduce((s, e) => s + (Number(e.custo_materiais) || 0), 0);

    // Equipamentos por criticidade
    const critCount: Record<string, number> = {};
    eq.forEach(e => { critCount[e.criticidade] = (critCount[e.criticidade] || 0) + 1; });

    // OS por tipo
    const tipoCount: Record<string, number> = {};
    os.forEach(o => { tipoCount[o.tipo] = (tipoCount[o.tipo] || 0) + 1; });

    // OS por prioridade
    const prioCount: Record<string, number> = {};
    os.forEach(o => { prioCount[o.prioridade] = (prioCount[o.prioridade] || 0) + 1; });

    setMetrics({
      totalOS, abertas, fechadas, urgentes, corretivas, preventivas, ratioPrevCorr,
      totalEquip: eq.length, custoTotal, custoMO, custoMat,
      critChart: Object.entries(critCount).map(([name, value]) => ({ name, value })),
      tipoChart: Object.entries(tipoCount).map(([name, value]) => ({ name, value })),
      prioChart: Object.entries(prioCount).map(([name, value]) => ({ name, value })),
    });
    setIsLoading(false);
  }

  if (isLoading && !metrics) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Métricas e Relatórios</h1><p className="text-sm text-muted-foreground">Análise detalhada por empresa ou global</p></div>
        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {metrics && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total OS', value: metrics.totalOS, icon: BarChart3 },
              { label: 'OS Abertas', value: metrics.abertas, icon: AlertTriangle },
              { label: 'OS Urgentes', value: metrics.urgentes, icon: AlertTriangle },
              { label: 'Equipamentos', value: metrics.totalEquip, icon: Wrench },
            ].map(k => (
              <Card key={k.label}><CardContent className="p-4 flex items-center gap-3">
                <k.icon className="h-7 w-7 text-primary" />
                <div><p className="text-xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p></div>
              </CardContent></Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ratio Prev/Corr</p>
              <p className="text-2xl font-bold text-primary">{metrics.ratioPrevCorr}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Custo Total</p>
              <p className="text-lg font-bold">R$ {metrics.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Custo Mão de Obra</p>
              <p className="text-lg font-bold">R$ {metrics.custoMO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Custo Materiais</p>
              <p className="text-lg font-bold">R$ {metrics.custoMat.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </CardContent></Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">OS por Tipo</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={metrics.tipoChart} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {metrics.tipoChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">OS por Prioridade</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.prioChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip /><Bar dataKey="value" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Equipamentos por Criticidade</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.critChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip /><Bar dataKey="value" fill="hsl(0,72%,51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {metrics.urgentes > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-warning">⚠️ {metrics.urgentes} OS urgente(s) em aberto. Recomenda-se entrar em contato com os clientes para oferecer suporte técnico.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
