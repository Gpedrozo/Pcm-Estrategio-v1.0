import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Database, Users, FileText, Shield, Building2, CreditCard } from 'lucide-react';

export default function MasterTI() {
  const { empresa, assinatura } = useEmpresa();
  const [stats, setStats] = useState({ profiles: 0, os: 0, equipamentos: 0, auditoria: 0, empresas: 0 });
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }),
      supabase.from('equipamentos').select('id', { count: 'exact', head: true }),
      supabase.from('auditoria').select('id', { count: 'exact', head: true }),
      supabase.from('empresas').select('*'),
    ]).then(([p, o, e, a, emp]) => {
      setStats({ profiles: p.count || 0, os: o.count || 0, equipamentos: e.count || 0, auditoria: a.count || 0, empresas: emp.data?.length || 0 });
      setEmpresas(emp.data || []);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center gap-3"><Crown className="h-8 w-8 text-primary" /><div><h1 className="page-title">Painel Master TI</h1><p className="page-subtitle">Configurações avançadas e estatísticas do sistema</p></div></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Building2 className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.empresas}</p><p className="text-sm text-muted-foreground">Empresas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Users className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.profiles}</p><p className="text-sm text-muted-foreground">Usuários</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><FileText className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.os}</p><p className="text-sm text-muted-foreground">Ordens de Serviço</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Database className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.equipamentos}</p><p className="text-sm text-muted-foreground">Equipamentos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Shield className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{stats.auditoria}</p><p className="text-sm text-muted-foreground">Logs Auditoria</p></div></CardContent></Card>
      </div>

      {/* Empresas cadastradas */}
      <Card className="card-industrial"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Empresas Cadastradas</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Nome</th><th>CNPJ</th><th>Plano</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>
        {empresas.map(e => (<tr key={e.id}><td className="font-medium">{e.nome}</td><td className="font-mono">{e.cnpj || '-'}</td><td><Badge variant="outline">{e.plano}</Badge></td><td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td><td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td></tr>))}
        {empresas.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma empresa</td></tr>}
      </tbody></table></div></CardContent></Card>

      {/* Assinatura atual */}
      {assinatura && (
        <Card className="card-industrial"><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Assinatura Atual</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Plano</span><span className="font-mono font-medium">{assinatura.plano_nome}</span></div>
          <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Status</span><Badge variant="default">{assinatura.status}</Badge></div>
          <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Módulos Ativos</span><span className="font-mono text-sm">{assinatura.modulos_ativos?.join(', ')}</span></div>
          <div className="flex justify-between py-2"><span className="text-muted-foreground">Início</span><span className="font-mono">{new Date(assinatura.data_inicio).toLocaleDateString('pt-BR')}</span></div>
        </CardContent></Card>
      )}

      <Card className="card-industrial"><CardHeader><CardTitle>Informações do Sistema</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Versão</span><span className="font-mono font-medium">PCM v3.0</span></div>
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Backend</span><span className="font-mono font-medium">Lovable Cloud</span></div>
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Banco de Dados</span><span className="font-mono font-medium">PostgreSQL</span></div>
        <div className="flex justify-between py-2 border-b border-border"><span className="text-muted-foreground">Empresa</span><span className="font-mono font-medium">{empresa?.nome || '-'}</span></div>
        <div className="flex justify-between py-2"><span className="text-muted-foreground">Ambiente</span><span className="font-mono font-medium">Produção</span></div>
      </CardContent></Card>
    </div>
  );
}
