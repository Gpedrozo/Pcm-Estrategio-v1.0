import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Users, FileText, Wrench, Shield, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

const COLORS = ['hsl(199,89%,48%)', 'hsl(142,72%,29%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(213,56%,24%)'];

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ empresas: 0, empresasAtivas: 0, usuarios: 0, os: 0, osAbertas: 0, osFechadas: 0, equipamentos: 0, auditoria: 0, planos: 0, assinaturasAtivas: 0 });
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);
  const [osTipoData, setOsTipoData] = useState<any[]>([]);
  const [empresaOsData, setEmpresaOsData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [empRes, profRes, osRes, eqRes, audRes, plRes, assRes] = await Promise.all([
      supabase.from('empresas').select('*'),
      supabase.from('profiles').select('id, empresa_id'),
      supabase.from('ordens_servico').select('id, status, tipo, empresa_id, created_at'),
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
    });

    // OS por status
    const statusCount: Record<string, number> = {};
    os.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
    setOsData(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

    // OS por tipo
    const tipoCount: Record<string, number> = {};
    os.forEach(o => { tipoCount[o.tipo] = (tipoCount[o.tipo] || 0) + 1; });
    setOsTipoData(Object.entries(tipoCount).map(([name, value]) => ({ name, value })));

    // OS por empresa
    const empOsCount: Record<string, number> = {};
    os.forEach(o => {
      const empNome = emp.find(e => e.id === o.empresa_id)?.nome || 'Sem empresa';
      empOsCount[empNome] = (empOsCount[empNome] || 0) + 1;
    });
    setEmpresaOsData(Object.entries(empOsCount).map(([name, os]) => ({ name, os })).sort((a, b) => b.os - a.os).slice(0, 10));

    setIsLoading(false);
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground text-sm">Visão geral de todos os sistemas e empresas</p>
      </div>

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
          <CreditCard className="h-6 w-6 mx-auto text-primary mb-2" />
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OS por Status */}
        <Card><CardHeader><CardTitle className="text-sm">OS por Status (Todas as Empresas)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={osData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {osData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* OS por Tipo */}
        <Card><CardHeader><CardTitle className="text-sm">OS por Tipo</CardTitle></CardHeader>
          <CardContent className="h-72">
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

        {/* OS por Empresa */}
        <Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm">Volume de OS por Empresa (Top 10)</CardTitle></CardHeader>
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
      </div>

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
                {empresas.slice(0, 5).map(e => (
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

function CreditCard(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
}
