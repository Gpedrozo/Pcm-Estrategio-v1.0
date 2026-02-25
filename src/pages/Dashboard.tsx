import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import {
  FileText, FilePlus, FileCheck, Clock, Activity, Gauge,
  Target, TrendingUp, Calendar, Loader2, DollarSign, BarChart3, Brain,
  AlertTriangle, Shield, Zap, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export default function Dashboard() {
  const { user } = useAuth();
  const { empresa } = useEmpresa();
  const { fromEmpresa } = useEmpresaQuery();
  const [os, setOs] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [execucoes, setExecucoes] = useState<any[]>([]);
  const [lubrificacao, setLubrificacao] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [osRes, equipRes, planosRes, execRes, lubRes] = await Promise.all([
          fromEmpresa('ordens_servico').order('created_at', { ascending: false }).limit(500),
          fromEmpresa('equipamentos').eq('ativo', true),
          fromEmpresa('planos_preventivos').eq('ativo', true),
          fromEmpresa('execucoes_os').order('created_at', { ascending: false }).limit(200),
          fromEmpresa('lubrificacao').eq('ativo', true),
        ]);
        setOs(osRes.data || []);
        setEquipamentos(equipRes.data || []);
        setPlanos(planosRes.data || []);
        setExecucoes(execRes.data || []);
        setLubrificacao(lubRes.data || []);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [fromEmpresa]);

  const ind = useMemo(() => {
    const abertas = os.filter(o => o.status === 'ABERTA').length;
    const emAndamento = os.filter(o => o.status === 'EM_ANDAMENTO').length;
    const aguardando = os.filter(o => o.status === 'AGUARDANDO_MATERIAL' || o.status === 'AGUARDANDO_APROVACAO').length;
    const fechadas = os.filter(o => o.status === 'FECHADA').length;
    const corretivas = os.filter(o => o.tipo === 'CORRETIVA').length;
    const preventivas = os.filter(o => o.tipo === 'PREVENTIVA').length;
    const preditivas = os.filter(o => o.tipo === 'PREDITIVA').length;
    const tempoTotal = execucoes.reduce((s, e) => s + (e.tempo_execucao || 0), 0);
    const tempoMedio = execucoes.length > 0 ? Math.round(tempoTotal / execucoes.length) : 0;
    const custoTotal = execucoes.reduce((s, e) => s + (Number(e.custo_total) || 0), 0);
    const custoMO = execucoes.reduce((s, e) => s + (Number(e.custo_mao_obra) || 0), 0);
    const custoMat = execucoes.reduce((s, e) => s + (Number(e.custo_materiais) || 0), 0);
    const custoTerc = execucoes.reduce((s, e) => s + (Number(e.custo_terceiros) || 0), 0);
    const ratioPreventiva = os.length > 0 ? ((preventivas / os.length) * 100) : 0;
    const backlog = os.filter(o => o.status !== 'FECHADA').length;
    const backlogTempo = backlog * (tempoMedio || 60);
    const backlogSemanas = backlogTempo / (44 * 60);
    const urgentes = os.filter(o => o.prioridade === 'URGENTE' && o.status !== 'FECHADA').length;

    // MTBF / MTTR simplificados
    const osFechadas = os.filter(o => o.status === 'FECHADA' && o.data_fechamento);
    const mttr = osFechadas.length > 0
      ? osFechadas.reduce((s, o) => {
          const diff = (new Date(o.data_fechamento).getTime() - new Date(o.data_solicitacao).getTime()) / (1000 * 60 * 60);
          return s + Math.max(diff, 0);
        }, 0) / osFechadas.length
      : 0;

    // Preventivas atrasadas
    const prevAtrasadas = planos.filter(p => new Date(p.proxima_execucao) < new Date()).length;
    const lubAtrasadas = lubrificacao.filter(l => new Date(l.proxima_execucao) < new Date()).length;
    const totalAtrasadas = prevAtrasadas + lubAtrasadas;

    return {
      abertas, emAndamento, aguardando, fechadas, total: os.length,
      corretivas, preventivas, preditivas, tempoMedio, custoTotal, custoMO, custoMat, custoTerc,
      equipAtivos: equipamentos.length, planosAtivos: planos.length,
      ratioPreventiva, backlog, backlogSemanas, urgentes, mttr, totalAtrasadas,
      lubAtivas: lubrificacao.length,
    };
  }, [os, equipamentos, planos, execucoes, lubrificacao]);

  const chartByTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    os.forEach(o => { counts[o.tipo] = (counts[o.tipo] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [os]);

  const chartByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    os.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
  }, [os]);

  const chartByPrioridade = useMemo(() => {
    const counts: Record<string, number> = {};
    os.forEach(o => { counts[o.prioridade] = (counts[o.prioridade] || 0) + 1; });
    const order = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];
    return order.filter(p => counts[p]).map(name => ({ name, value: counts[name] }));
  }, [os]);

  const chartTendencia = useMemo(() => {
    const months: Record<string, { abertas: number; fechadas: number }> = {};
    os.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { abertas: 0, fechadas: 0 };
      months[key].abertas++;
      if (o.status === 'FECHADA') months[key].fechadas++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([mes, v]) => ({ mes: mes.substring(5) + '/' + mes.substring(2, 4), ...v }));
  }, [os]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);
  const formatMinutes = (m: number) => { const h = Math.floor(m / 60); const min = m % 60; return h > 0 ? `${h}h ${min}m` : `${min}m`; };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ABERTA: 'status-aberta', EM_ANDAMENTO: 'status-andamento',
      FECHADA: 'status-fechada', AGUARDANDO_MATERIAL: 'status-aguardando', AGUARDANDO_APROVACAO: 'status-aguardando',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || ''}`}>{status.replace(/_/g, ' ')}</span>;
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard PCM</h1>
          <p className="page-subtitle">Bem-vindo, {user?.nome}! {empresa?.nome && `Empresa: ${empresa.nome}`}</p>
        </div>
        <Link to="/os/nova"><Button className="btn-industrial gap-2"><FilePlus className="h-4 w-4" /> Nova O.S</Button></Link>
      </div>

      {/* Alertas */}
      {(ind.urgentes > 0 || ind.totalAtrasadas > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ind.urgentes > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <p className="text-sm font-medium text-destructive">{ind.urgentes} OS urgente(s) em aberto — ação imediata necessária</p>
              </CardContent>
            </Card>
          )}
          {ind.totalAtrasadas > 0 && (
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning shrink-0" />
                <p className="text-sm font-medium text-warning">{ind.totalAtrasadas} manutenção(ões) programada(s) atrasada(s)</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Link to="/os/nova"><Button className="w-full h-11 gap-2" size="sm"><FilePlus className="h-4 w-4" />Nova O.S</Button></Link>
        <Link to="/os/fechar"><Button variant="outline" className="w-full h-11 gap-2" size="sm"><FileCheck className="h-4 w-4" />Fechar O.S</Button></Link>
        <Link to="/backlog"><Button variant="outline" className="w-full h-11 gap-2" size="sm"><Target className="h-4 w-4" />Backlog</Button></Link>
        <Link to="/relatorios"><Button variant="outline" className="w-full h-11 gap-2" size="sm"><BarChart3 className="h-4 w-4" />Relatórios</Button></Link>
        <Link to="/analise-ia"><Button variant="outline" className="w-full h-11 gap-2" size="sm"><Brain className="h-4 w-4" />Análise IA</Button></Link>
      </div>

      {/* Operational Indicators */}
      <div>
        <h2 className="text-base font-semibold mb-3">Indicadores Operacionais</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { title: 'OS Abertas', value: ind.abertas, icon: FileText, color: 'text-warning' },
            { title: 'Em Andamento', value: ind.emAndamento, icon: Clock, color: 'text-info' },
            { title: 'Aguardando', value: ind.aguardando, icon: Shield, color: 'text-muted-foreground' },
            { title: 'Fechadas', value: ind.fechadas, icon: FileCheck, color: 'text-success' },
            { title: 'Urgentes', value: ind.urgentes, icon: Zap, color: 'text-destructive' },
            { title: 'Tempo Médio', value: formatMinutes(ind.tempoMedio), icon: Activity, color: 'text-primary' },
            { title: 'Equipamentos', value: ind.equipAtivos, icon: Gauge, color: 'text-foreground' },
            { title: 'Planos Ativos', value: ind.planosAtivos, icon: Calendar, color: 'text-primary' },
          ].map(i => (
            <Card key={i.title} className="card-industrial">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1"><i.icon className={`h-4 w-4 ${i.color}`} /></div>
                <div className="text-xl font-bold font-mono">{i.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{i.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div>
        <h2 className="text-base font-semibold mb-3">Indicadores de Desempenho</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="card-industrial">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <span className="text-sm font-medium text-muted-foreground">Ratio Prev/Corr</span>
              </div>
              <p className="text-2xl font-bold font-mono">{ind.ratioPreventiva.toFixed(0)}%</p>
              <div className="mt-2 flex gap-4 text-xs">
                <span className="text-success flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />Prev: {ind.preventivas}</span>
                <span className="text-destructive flex items-center gap-1"><ArrowDownRight className="h-3 w-3" />Corr: {ind.corretivas}</span>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(ind.ratioPreventiva, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-info/10"><Calendar className="h-5 w-5 text-info" /></div>
                <span className="text-sm font-medium text-muted-foreground">Backlog</span>
              </div>
              <p className="text-2xl font-bold font-mono">{ind.backlogSemanas.toFixed(1)} sem</p>
              <p className="text-xs text-muted-foreground mt-1">{ind.backlog} OS pendentes</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${ind.backlogSemanas <= 2 ? 'bg-success' : ind.backlogSemanas <= 4 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${Math.min((ind.backlogSemanas / 6) * 100, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-warning/10"><Activity className="h-5 w-5 text-warning" /></div>
                <span className="text-sm font-medium text-muted-foreground">MTTR</span>
              </div>
              <p className="text-2xl font-bold font-mono">{ind.mttr.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground mt-1">Tempo médio de reparo</p>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
                <span className="text-sm font-medium text-muted-foreground">Custo Total</span>
              </div>
              <p className="text-2xl font-bold font-mono">{formatCurrency(ind.custoTotal)}</p>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[10px]">
                <div><p className="text-muted-foreground">MO</p><p className="font-medium">{formatCurrency(ind.custoMO)}</p></div>
                <div><p className="text-muted-foreground">Mat.</p><p className="font-medium">{formatCurrency(ind.custoMat)}</p></div>
                <div><p className="text-muted-foreground">Terc.</p><p className="font-medium">{formatCurrency(ind.custoTerc)}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-warning/10"><Gauge className="h-5 w-5 text-warning" /></div>
                <span className="text-sm font-medium text-muted-foreground">Taxa Fechamento</span>
              </div>
              <p className="text-2xl font-bold font-mono">{ind.total > 0 ? ((ind.fechadas / ind.total) * 100).toFixed(0) : 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">{ind.fechadas} de {ind.total} OS</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${ind.total > 0 ? (ind.fechadas / ind.total) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tendência + Prioridade */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="card-industrial lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Tendência Mensal de OS</CardTitle></CardHeader>
          <CardContent>
            {chartTendencia.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartTendencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="abertas" name="Abertas" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="fechadas" name="Fechadas" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent>
        </Card>

        <Card className="card-industrial">
          <CardHeader><CardTitle className="text-sm">OS por Prioridade</CardTitle></CardHeader>
          <CardContent>
            {chartByPrioridade.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartByPrioridade} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartByPrioridade.map((entry, i) => (
                      <Cell key={i} fill={
                        entry.name === 'URGENTE' ? 'hsl(var(--destructive))' :
                        entry.name === 'ALTA' ? 'hsl(var(--warning))' :
                        entry.name === 'MEDIA' ? 'hsl(var(--info))' :
                        'hsl(var(--success))'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Tipo + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-industrial">
          <CardHeader><CardTitle className="text-sm">Distribuição por Tipo</CardTitle></CardHeader>
          <CardContent>
            {chartByTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chartByTipo} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {chartByTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent>
        </Card>

        <Card className="card-industrial">
          <CardHeader><CardTitle className="text-sm">OS por Status</CardTitle></CardHeader>
          <CardContent>
            {chartByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>

      {/* Recent OS */}
      <Card className="card-industrial">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Últimas Ordens de Serviço</CardTitle>
            <Link to="/os/historico" className="text-sm text-primary hover:underline">Ver todas →</Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="table-industrial">
              <thead><tr><th>Nº</th><th>Tipo</th><th>TAG</th><th>Equipamento</th><th>Prioridade</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {os.slice(0, 10).map(o => (
                  <tr key={o.id}>
                    <td className="font-mono font-medium">{o.numero_os}</td>
                    <td><Badge variant="outline">{o.tipo}</Badge></td>
                    <td className="font-mono text-primary">{o.tag}</td>
                    <td className="max-w-[150px] truncate">{o.equipamento}</td>
                    <td><Badge variant={o.prioridade === 'URGENTE' ? 'destructive' : o.prioridade === 'ALTA' ? 'default' : 'secondary'}>{o.prioridade}</Badge></td>
                    <td>{statusBadge(o.status)}</td>
                    <td className="text-muted-foreground">{new Date(o.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                {os.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma OS cadastrada</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
