import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Users, FileText, Wrench, Shield, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

const COLORS = ['hsl(199,89%,48%)', 'hsl(142,72%,29%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(213,56%,24%)'];

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ empresas: 0, empresasAtivas: 0, usuarios: 0, os: 0, osAbertas: 0, osFechadas: 0, equipamentos: 0, auditoria: 0, planos: 0, assinaturasAtivas: 0, urgentes: 0 });
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);
  const [osTipoData, setOsTipoData] = useState<any[]>([]);
  const [empresaOsData, setEmpresaOsData] = useState<any[]>([]);
  const [tendenciaData, setTendenciaData] = useState<any[]>([]);
  const [prioData, setPrioData] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [empRes, profRes, osRes, eqRes, audRes, plRes, assRes] = await Promise.all([
      supabase.from('empresas').select('*'),
      supabase.from('profiles').select('id, empresa_id'),
      supabase.from('ordens_servico').select('id, status, tipo, prioridade, empresa_id, created_at'),
      supabase.from('equipamentos').select('id', { count: 'exact', head: true }),
      supabase.from('auditoria').select('id', { count: 'exact', head: true }),
      supabase.from('planos_saas').select('id', { count: 'exact', head: true }),
      supabase.from('assinaturas').select('*').eq('status', 'ATIVA'),
    ]);

    const emp = empRes.data || [];
    const os = osRes.data || [];
    const profiles = profRes.data || [];

    setEmpresas(emp);
    setStats({
      empresas: emp.length,
      empresasAtivas: emp.filter(e => e.ativo).length,
      usuarios: profiles.length,
      os: os.length,
      osAbertas: os.filter(o => o.status !== 'FECHADA').length,
      osFechadas: os.filter(o => o.status === 'FECHADA').length,
      equipamentos: eqRes.count || 0,
      auditoria: audRes.count || 0,
      planos: plRes.count || 0,
      assinaturasAtivas: assRes.data?.length || 0,
      urgentes: os.filter(o => o.prioridade === 'URGENTE' && o.status !== 'FECHADA').length,
    });

    // OS por status
    const statusCount: Record<string, number> = {};
    os.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
    setOsData(Object.entries(statusCount).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })));

    // OS por tipo
    const tipoCount: Record<string, number> = {};
    os.forEach(o => { tipoCount[o.tipo] = (tipoCount[o.tipo] || 0) + 1; });
    setOsTipoData(Object.entries(tipoCount).map(([name, value]) => ({ name, value })));

    // OS por prioridade
    const prioCount: Record<string, number> = {};
    os.forEach(o => { prioCount[o.prioridade] = (prioCount[o.prioridade] || 0) + 1; });
    setPrioData(Object.entries(prioCount).map(([name, value]) => ({ name, value })));

    // OS por empresa
    const empOsCount: Record<string, number> = {};
    os.forEach(o => {
      const empNome = emp.find(e => e.id === o.empresa_id)?.nome || 'Sem empresa';
      empOsCount[empNome] = (empOsCount[empNome] || 0) + 1;
    });
    setEmpresaOsData(Object.entries(empOsCount).map(([name, os]) => ({ name, os })).sort((a, b) => b.os - a.os).slice(0, 10));

    // Tendência mensal
    const months: Record<string, { criadas: number; fechadas: number }> = {};
    os.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
      if (!months[key]) months[key] = { criadas: 0, fechadas: 0 };
      months[key].criadas++;
      if (o.status === 'FECHADA') months[key].fechadas++;
    });
    setTendenciaData(Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([mes, v]) => ({ mes, ...v })));

    setIsLoading(false);
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground text-sm">Visão geral de todos os sistemas e empresas</p>
      </div>

      {stats.urgentes > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <p className="text-sm font-medium text-destructive">{stats.urgentes} OS urgente(s) em aberto em todas as empresas</p>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Building2, label: 'Empresas', value: stats.empresas, sub: `${stats.empresasAtivas} ativas`, color: 'text-primary' },
          { icon: Users, label: 'Usuários', value: stats.usuarios, sub: 'cadastrados', color: 'text-primary' },
          { icon: FileText, label: 'Ordens de Serviço', value: stats.os, sub: `${stats.osAbertas} abertas`, color: 'text-primary' },
          { icon: Wrench, label: 'Equipamentos', value: stats.equipamentos, sub: 'registrados', color: 'text-primary' },
          { icon: Shield, label: 'Logs Auditoria', value: stats.auditoria, sub: 'registros', color: 'text-primary' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <k.icon className={`h-8 w-8 ${k.color} shrink-0`} />
                <div>
                  <p className="text-2xl font-bold">{k.value.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="text-[10px] text-muted-foreground">{k.sub}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="h-6 w-6 mx-auto text-primary mb-2" />
          <p className="text-xl font-bold">{stats.planos}</p>
          <p className="text-xs text-muted-foreground">Planos Cadastrados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
          <p className="text-xl font-bold">{stats.assinaturasAtivas}</p>
          <p className="text-xs text-muted-foreground">Assinaturas Ativas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <CheckCircle2 className="h-6 w-6 mx-auto text-success mb-2" />
          <p className="text-xl font-bold">{stats.osFechadas}</p>
          <p className="text-xs text-muted-foreground">OS Concluídas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-warning mb-2" />
          <p className="text-xl font-bold">{stats.osAbertas}</p>
          <p className="text-xs text-muted-foreground">OS em Aberto</p>
        </CardContent></Card>
      </div>

      {/* Tendência */}
      <Card><CardHeader><CardTitle className="text-sm">Tendência Mensal — Criadas vs Fechadas (Todas as Empresas)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {tendenciaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="criadas" name="Criadas" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="fechadas" name="Fechadas" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="text-sm">OS por Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={osData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {osData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-sm">OS por Tipo</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osTipoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-sm">OS por Prioridade</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {prioData.map((e, i) => <Cell key={i} fill={e.name === 'URGENTE' ? 'hsl(0,72%,51%)' : e.name === 'ALTA' ? 'hsl(38,92%,50%)' : COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* OS por Empresa */}
      <Card><CardHeader><CardTitle className="text-sm">Volume de OS por Empresa (Top 10)</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={empresaOsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="os" fill="hsl(199,89%,48%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Empresas Overview */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Empresas — Resumo Rápido</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Empresa</th>
                <th className="p-3 text-left font-medium">CNPJ</th>
                <th className="p-3 text-left font-medium">Plano</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Cadastro</th>
              </tr></thead>
              <tbody>
                {empresas.slice(0, 10).map(e => (
                  <tr key={e.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{e.nome}</td>
                    <td className="p-3 font-mono text-xs">{e.cnpj || '-'}</td>
                    <td className="p-3"><Badge variant="outline">{e.plano}</Badge></td>
                    <td className="p-3"><Badge variant={e.ativo ? 'default' : 'destructive'}>{e.ativo ? 'Ativo' : 'Bloqueado'}</Badge></td>
                    <td className="p-3 text-xs">{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
