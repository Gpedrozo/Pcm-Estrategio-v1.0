import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, Crown, Database, Users, FileText, Shield, Building2, CreditCard,
  Plus, Pencil, Trash2, Power, UserCog, RefreshCw, Search, Info, Lock, Activity
} from 'lucide-react';
import { MODULE_OPTIONS } from '@/constants/modules';

// ─── Tipos ───────────────────────────────────────────
interface EmpresaRow {
  id: string; nome: string; cnpj: string | null; logo_url: string | null;
  plano: string; ativo: boolean; created_at: string; updated_at: string;
}
interface PlanoRow {
  id: string; nome: string; preco: number; max_usuarios: number;
  modulos_ativos: string[]; ativo: boolean; created_at: string;
}
interface AssinaturaRow {
  id: string; empresa_id: string; plano_id: string; status: string;
  data_inicio: string; data_fim: string | null;
}
interface ProfileRow {
  id: string; nome: string; empresa_id: string | null; created_at: string;
}
interface RoleRow {
  id: string; user_id: string; role: string; empresa_id: string | null;
}

interface AuditoriaRow {
  id: string;
  usuario_nome: string;
  acao: string;
  descricao: string;
  tag: string | null;
  created_at: string;
  empresa_id: string | null;
}

const TODOS_MODULOS = MODULE_OPTIONS;

export default function MasterTI() {
  const { empresa: minhaEmpresa } = useEmpresa();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Data
  const [stats, setStats] = useState({ profiles: 0, os: 0, equipamentos: 0, auditoria: 0, empresas: 0 });
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([]);
  const [planos, setPlanos] = useState<PlanoRow[]>([]);
  const [assinaturas, setAssinaturas] = useState<AssinaturaRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);

  // Filters
  const [searchEmpresas, setSearchEmpresas] = useState('');
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [searchAuditoria, setSearchAuditoria] = useState('');

  // Dialogs
  const [empresaDialog, setEmpresaDialog] = useState(false);
  const [planoDialog, setPlanoDialog] = useState(false);
  const [assinaturaDialog, setAssinaturaDialog] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaRow | null>(null);
  const [editingPlano, setEditingPlano] = useState<PlanoRow | null>(null);

  // Monitoramento e Auditoria
  const [tableStats, setTableStats] = useState<Array<{ table: string; total: number }>>([]);
  const [auditRows, setAuditRows] = useState<AuditoriaRow[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [securityOverview, setSecurityOverview] = useState({
    available: true,
    securityLogs: 0,
    failedEvents24h: 0,
    rateLimits24h: 0,
    permissoes: 0,
    configuracoes: 0,
    modulosComPermissao: 0,
  });

  // Forms
  const [formEmpresa, setFormEmpresa] = useState({ nome: '', cnpj: '', plano: 'BASICO' });
  const [formPlano, setFormPlano] = useState({ nome: '', preco: 0, max_usuarios: 5, modulos_ativos: [] as string[] });
  const [formAssinatura, setFormAssinatura] = useState({ empresa_id: '', plano_id: '', data_inicio: new Date().toISOString().split('T')[0] });

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    const [p, o, e, a, emp, pl, ass, prof, rl] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('ordens_servico').select('id', { count: 'exact', head: true }),
      supabase.from('equipamentos').select('id', { count: 'exact', head: true }),
      supabase.from('auditoria').select('id', { count: 'exact', head: true }),
      supabase.from('empresas').select('*').order('nome'),
      supabase.from('planos_saas').select('*').order('preco'),
      supabase.from('assinaturas').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('nome'),
      supabase.from('user_roles').select('*'),
    ]);
    setStats({ profiles: p.count || 0, os: o.count || 0, equipamentos: e.count || 0, auditoria: a.count || 0, empresas: emp.data?.length || 0 });
    setEmpresas((emp.data || []) as EmpresaRow[]);
    setPlanos((pl.data || []) as PlanoRow[]);
    setAssinaturas((ass.data || []) as AssinaturaRow[]);
    setProfiles((prof.data || []) as ProfileRow[]);
    setRoles((rl.data || []) as RoleRow[]);
    setIsLoading(false);
  }, []);

  const loadMonitoramento = useCallback(async () => {
    const tables = ['empresas', 'profiles', 'user_roles', 'ordens_servico', 'equipamentos', 'mecanicos', 'materiais', 'fornecedores', 'contratos', 'planos_saas', 'assinaturas', 'auditoria'];
    const results = await Promise.all(
      tables.map(async (table) => {
        const { count } = await supabase.from(table as any).select('id', { count: 'exact', head: true });
        return { table, total: count || 0 };
      })
    );
    setTableStats(results.sort((a, b) => b.total - a.total));
  }, []);

  const loadAuditoria = useCallback(async () => {
    setLoadingAudit(true);
    const { data } = await supabase
      .from('auditoria')
      .select('id, usuario_nome, acao, descricao, tag, created_at, empresa_id')
      .order('created_at', { ascending: false })
      .limit(200);
    setAuditRows((data || []) as AuditoriaRow[]);
    setLoadingAudit(false);
  }, []);

  const loadSecurityOverview = useCallback(async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [logsRes, failedRes, rateRes, permCountRes, permRowsRes, cfgRes] = await Promise.all([
      supabase.from('security_logs').select('id', { count: 'exact', head: true }),
      supabase.from('security_logs').select('id', { count: 'exact', head: true }).eq('success', false).gte('created_at', oneDayAgo),
      supabase.from('rate_limits').select('id', { count: 'exact', head: true }).gte('window_start', oneDayAgo),
      supabase.from('permissoes_granulares').select('id', { count: 'exact', head: true }),
      supabase.from('permissoes_granulares').select('modulo'),
      supabase.from('configuracoes_sistema').select('id', { count: 'exact', head: true }),
    ]);

    const hasError = Boolean(logsRes.error || failedRes.error || rateRes.error || permCountRes.error || permRowsRes.error || cfgRes.error);
    const modulosComPermissao = new Set((permRowsRes.data || []).map((r: any) => r.modulo)).size;

    setSecurityOverview({
      available: !hasError,
      securityLogs: logsRes.count || 0,
      failedEvents24h: failedRes.count || 0,
      rateLimits24h: rateRes.count || 0,
      permissoes: permCountRes.count || 0,
      configuracoes: cfgRes.count || 0,
      modulosComPermissao,
    });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadMonitoramento(); }, [loadMonitoramento]);
  useEffect(() => { loadAuditoria(); }, [loadAuditoria]);
  useEffect(() => { loadSecurityOverview(); }, [loadSecurityOverview]);

  // ─── Empresa CRUD ───────────────────────────────────
  const openNewEmpresa = () => { setEditingEmpresa(null); setFormEmpresa({ nome: '', cnpj: '', plano: 'BASICO' }); setEmpresaDialog(true); };
  const openEditEmpresa = (e: EmpresaRow) => { setEditingEmpresa(e); setFormEmpresa({ nome: e.nome, cnpj: e.cnpj || '', plano: e.plano }); setEmpresaDialog(true); };

  const saveEmpresa = async () => {
    if (!formEmpresa.nome.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    if (editingEmpresa) {
      const { error } = await supabase.from('empresas').update({ nome: formEmpresa.nome, cnpj: formEmpresa.cnpj || null, plano: formEmpresa.plano }).eq('id', editingEmpresa.id);
      if (error) { toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Empresa atualizada' });
    } else {
      const { error } = await supabase.from('empresas').insert({ nome: formEmpresa.nome, cnpj: formEmpresa.cnpj || null, plano: formEmpresa.plano });
      if (error) { toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Empresa criada' });
    }
    setEmpresaDialog(false);
    loadAll();
  };

  const toggleEmpresa = async (e: EmpresaRow) => {
    await supabase.from('empresas').update({ ativo: !e.ativo }).eq('id', e.id);
    toast({ title: e.ativo ? 'Empresa bloqueada' : 'Empresa desbloqueada' });
    loadAll();
  };

  const deleteEmpresa = async (e: EmpresaRow) => {
    if (!confirm(`Excluir empresa "${e.nome}"? Isso é irreversível.`)) return;
    const { error } = await supabase.from('empresas').delete().eq('id', e.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Empresa excluída' });
    loadAll();
  };

  // ─── Planos CRUD ────────────────────────────────────
  const openNewPlano = () => { setEditingPlano(null); setFormPlano({ nome: '', preco: 0, max_usuarios: 5, modulos_ativos: [] }); setPlanoDialog(true); };
  const openEditPlano = (p: PlanoRow) => { setEditingPlano(p); setFormPlano({ nome: p.nome, preco: p.preco, max_usuarios: p.max_usuarios, modulos_ativos: p.modulos_ativos || [] }); setPlanoDialog(true); };

  const toggleModulo = (mod: string) => {
    setFormPlano(prev => ({
      ...prev,
      modulos_ativos: prev.modulos_ativos.includes(mod)
        ? prev.modulos_ativos.filter(m => m !== mod)
        : [...prev.modulos_ativos, mod],
    }));
  };

  const savePlano = async () => {
    if (!formPlano.nome.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    const data = { nome: formPlano.nome, preco: formPlano.preco, max_usuarios: formPlano.max_usuarios, modulos_ativos: formPlano.modulos_ativos };
    if (editingPlano) {
      const { error } = await supabase.from('planos_saas').update(data).eq('id', editingPlano.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Plano atualizado' });
    } else {
      const { error } = await supabase.from('planos_saas').insert(data);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Plano criado' });
    }
    setPlanoDialog(false);
    loadAll();
  };

  const deletePlano = async (p: PlanoRow) => {
    if (!confirm(`Excluir plano "${p.nome}"?`)) return;
    const { error } = await supabase.from('planos_saas').delete().eq('id', p.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Plano excluído' });
    loadAll();
  };

  // ─── Assinaturas ────────────────────────────────────
  const saveAssinatura = async () => {
    if (!formAssinatura.empresa_id || !formAssinatura.plano_id) { toast({ title: 'Selecione empresa e plano', variant: 'destructive' }); return; }
    // Desativa assinaturas anteriores da empresa
    await supabase.from('assinaturas').update({ status: 'CANCELADA' }).eq('empresa_id', formAssinatura.empresa_id).eq('status', 'ATIVA');
    const { error } = await supabase.from('assinaturas').insert({
      empresa_id: formAssinatura.empresa_id,
      plano_id: formAssinatura.plano_id,
      data_inicio: formAssinatura.data_inicio,
      status: 'ATIVA',
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Assinatura criada' });
    setAssinaturaDialog(false);
    loadAll();
  };

  const cancelarAssinatura = async (a: AssinaturaRow) => {
    await supabase.from('assinaturas').update({ status: 'CANCELADA' }).eq('id', a.id);
    toast({ title: 'Assinatura cancelada' });
    loadAll();
  };

  // ─── Usuários / Roles ──────────────────────────────
  const getRole = (userId: string) => roles.find(r => r.user_id === userId)?.role || 'USUARIO';
  const getRoleId = (userId: string) => roles.find(r => r.user_id === userId)?.id;

  const changeRole = async (userId: string, newRole: string) => {
    const existingRoleId = getRoleId(userId);
    if (existingRoleId) {
      await supabase.from('user_roles').update({ role: newRole as any }).eq('id', existingRoleId);
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
    }
    toast({ title: 'Role atualizada' });
    loadAll();
  };

  const changeUserEmpresa = async (userId: string, empresaId: string | null) => {
    await supabase.from('profiles').update({ empresa_id: empresaId }).eq('id', userId);
    // Also update empresa_id on user_roles
    const rid = getRoleId(userId);
    if (rid) await supabase.from('user_roles').update({ empresa_id: empresaId } as any).eq('id', rid);
    toast({ title: 'Empresa do usuário atualizada' });
    loadAll();
  };

  // Helpers
  const getEmpresaNome = (id: string | null) => empresas.find(e => e.id === id)?.nome || '-';
  const getPlanoNome = (id: string) => planos.find(p => p.id === id)?.nome || '-';
  const filteredEmpresas = empresas.filter(e => e.nome.toLowerCase().includes(searchEmpresas.toLowerCase()));
  const filteredProfiles = profiles.filter(p => p.nome.toLowerCase().includes(searchUsuarios.toLowerCase()));
  const filteredAuditoria = auditRows.filter(a => {
    if (!searchAuditoria) return true;
    const q = searchAuditoria.toLowerCase();
    return (
      a.usuario_nome?.toLowerCase().includes(q) ||
      a.acao?.toLowerCase().includes(q) ||
      a.descricao?.toLowerCase().includes(q) ||
      a.tag?.toLowerCase().includes(q)
    );
  });

  const securityStats = {
    master: roles.filter(r => r.role === 'MASTER_TI').length,
    admin: roles.filter(r => r.role === 'ADMIN').length,
    usuario: roles.filter(r => r.role === 'USUARIO').length,
  };

  const roleColor = (r: string) => {
    if (r === 'MASTER_TI') return 'destructive' as const;
    if (r === 'ADMIN') return 'default' as const;
    return 'secondary' as const;
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Painel Master TI</h1>
            <p className="text-muted-foreground text-sm">Gerenciamento integral do sistema</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Building2, label: 'Empresas', value: stats.empresas },
          { icon: Users, label: 'Usuários', value: stats.profiles },
          { icon: FileText, label: 'O.S', value: stats.os },
          { icon: Database, label: 'Equipamentos', value: stats.equipamentos },
          { icon: Shield, label: 'Logs', value: stats.auditoria },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3">
            <k.icon className="h-8 w-8 text-primary shrink-0" />
            <div><p className="text-2xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="empresas">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 w-full h-auto gap-1">
          <TabsTrigger value="empresas"><Building2 className="h-4 w-4 mr-1 hidden sm:inline" />Empresas</TabsTrigger>
          <TabsTrigger value="planos"><CreditCard className="h-4 w-4 mr-1 hidden sm:inline" />Planos</TabsTrigger>
          <TabsTrigger value="assinaturas"><CreditCard className="h-4 w-4 mr-1 hidden sm:inline" />Assinaturas</TabsTrigger>
          <TabsTrigger value="usuarios"><UserCog className="h-4 w-4 mr-1 hidden sm:inline" />Usuários</TabsTrigger>
          <TabsTrigger value="monitor"><Activity className="h-4 w-4 mr-1 hidden sm:inline" />Monitor</TabsTrigger>
          <TabsTrigger value="auditoria"><FileText className="h-4 w-4 mr-1 hidden sm:inline" />Auditoria</TabsTrigger>
          <TabsTrigger value="seguranca"><Lock className="h-4 w-4 mr-1 hidden sm:inline" />Segurança</TabsTrigger>
          <TabsTrigger value="permissoes"><Shield className="h-4 w-4 mr-1 hidden sm:inline" />Permissões</TabsTrigger>
          <TabsTrigger value="configuracoes"><Info className="h-4 w-4 mr-1 hidden sm:inline" />Configs</TabsTrigger>
          <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1 hidden sm:inline" />Documentos</TabsTrigger>
          <TabsTrigger value="sistema"><Info className="h-4 w-4 mr-1 hidden sm:inline" />Sistema</TabsTrigger>
        </TabsList>

        {/* ─── TAB EMPRESAS ─── */}
        <TabsContent value="empresas">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Empresas Cadastradas</CardTitle>
              <div className="flex gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 w-48" value={searchEmpresas} onChange={e => setSearchEmpresas(e.target.value)} /></div>
                <Button size="sm" onClick={openNewEmpresa}><Plus className="h-4 w-4 mr-1" />Nova Empresa</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left font-medium">Nome</th><th className="p-3 text-left font-medium">CNPJ</th><th className="p-3 text-left font-medium">Plano</th><th className="p-3 text-left font-medium">Status</th><th className="p-3 text-left font-medium">Cadastro</th><th className="p-3 text-left font-medium">Ações</th></tr></thead>
                  <tbody>
                    {filteredEmpresas.map(e => (
                      <tr key={e.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{e.nome}</td>
                        <td className="p-3 font-mono text-xs">{e.cnpj || '-'}</td>
                        <td className="p-3"><Badge variant="outline">{e.plano}</Badge></td>
                        <td className="p-3"><Badge variant={e.ativo ? 'default' : 'destructive'}>{e.ativo ? 'Ativo' : 'Bloqueado'}</Badge></td>
                        <td className="p-3 text-xs">{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditEmpresa(e)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => toggleEmpresa(e)} title={e.ativo ? 'Bloquear' : 'Desbloquear'}><Power className={`h-4 w-4 ${e.ativo ? 'text-green-500' : 'text-destructive'}`} /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteEmpresa(e)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEmpresas.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma empresa encontrada</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Monitoramento de Tabelas</CardTitle>
              <Button size="sm" variant="outline" onClick={loadMonitoramento}><RefreshCw className="h-4 w-4 mr-1" />Recarregar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left font-medium">Tabela</th><th className="p-3 text-left font-medium">Registros</th></tr></thead>
                  <tbody>
                    {tableStats.map(t => (
                      <tr key={t.table} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{t.table}</td>
                        <td className="p-3 font-bold text-primary">{t.total}</td>
                      </tr>
                    ))}
                    {tableStats.length === 0 && <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">Sem dados de monitoramento</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Logs de Auditoria</CardTitle>
              <div className="flex gap-2">
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar ação/usuário..." className="pl-8 w-56" value={searchAuditoria} onChange={e => setSearchAuditoria(e.target.value)} /></div>
                <Button size="sm" variant="outline" onClick={loadAuditoria}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingAudit ? (
                <div className="p-8 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left font-medium">Data</th><th className="p-3 text-left font-medium">Usuário</th><th className="p-3 text-left font-medium">Ação</th><th className="p-3 text-left font-medium">Descrição</th><th className="p-3 text-left font-medium">TAG</th></tr></thead>
                    <tbody>
                      {filteredAuditoria.map(log => (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-xs">{new Date(log.created_at).toLocaleString('pt-BR')}</td>
                          <td className="p-3">{log.usuario_nome || '-'}</td>
                          <td className="p-3"><Badge variant="outline">{log.acao}</Badge></td>
                          <td className="p-3">{log.descricao}</td>
                          <td className="p-3 text-xs font-mono">{log.tag || '-'}</td>
                        </tr>
                      ))}
                      {filteredAuditoria.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum log encontrado</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader><CardTitle className="text-base">Perfis de Acesso</CardTitle></CardHeader><CardContent className="space-y-2">
              <div className="flex justify-between"><span>MASTER_TI</span><span className="font-bold text-destructive">{securityStats.master}</span></div>
              <div className="flex justify-between"><span>ADMIN</span><span className="font-bold text-primary">{securityStats.admin}</span></div>
              <div className="flex justify-between"><span>USUARIO</span><span className="font-bold">{securityStats.usuario}</span></div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Eventos de Segurança</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span>Total security logs</span><span className="font-bold">{securityOverview.securityLogs}</span></div>
              <div className="flex items-center justify-between"><span>Falhas (24h)</span><span className="font-bold text-destructive">{securityOverview.failedEvents24h}</span></div>
              <div className="flex items-center justify-between"><span>Rate limit (24h)</span><span className="font-bold text-warning">{securityOverview.rateLimits24h}</span></div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Controles Ativos</CardTitle></CardHeader><CardContent className="text-sm space-y-2">
              <div className="flex items-center justify-between"><span>RLS por empresa</span><Badge>Ativo</Badge></div>
              <div className="flex items-center justify-between"><span>Auditoria automática DB</span><Badge>Ativo</Badge></div>
              <div className="flex items-center justify-between"><span>Logs de segurança</span><Badge variant={securityOverview.available ? 'default' : 'destructive'}>{securityOverview.available ? 'Ativo' : 'Pendente migration'}</Badge></div>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="permissoes">
          <Card><CardHeader><CardTitle className="text-lg">Permissões Granulares</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Regras cadastradas</p><p className="text-2xl font-bold">{securityOverview.permissoes}</p></div>
              <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Módulos com regra</p><p className="text-2xl font-bold">{securityOverview.modulosComPermissao}</p></div>
              <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Configurações globais</p><p className="text-2xl font-bold">{securityOverview.configuracoes}</p></div>
            </div>
            <p className="text-sm text-muted-foreground">As regras detalhadas por usuário e módulo podem ser administradas via tabelas de segurança e pelo painel administrativo global.</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="configuracoes">
          <Card><CardHeader><CardTitle className="text-lg">Configurações Globais</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Tabela dedicada disponível: <strong>configuracoes_sistema</strong>.</p>
            <p>Total atual de configurações: <strong>{securityOverview.configuracoes}</strong>.</p>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card><CardHeader><CardTitle className="text-lg">Layouts de Documentos</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>O editor avançado de layout documental da versão de referência depende de estrutura adicional de dados.</p>
            <p>Documentos técnicos e relatórios permanecem ativos nos módulos operacionais atuais.</p>
          </CardContent></Card>
        </TabsContent>

        {/* ─── TAB PLANOS ─── */}
        <TabsContent value="planos">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Planos SaaS</CardTitle>
              <Button size="sm" onClick={openNewPlano}><Plus className="h-4 w-4 mr-1" />Novo Plano</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planos.map(p => (
                  <Card key={p.id} className={`relative ${!p.ativo ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{p.nome}</h3>
                          <p className="text-2xl font-bold text-primary">R$ {Number(p.preco).toFixed(2)}<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditPlano(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => deletePlano(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Máx {p.max_usuarios} usuários</p>
                      <div className="flex flex-wrap gap-1">
                        {(p.modulos_ativos || []).map(m => <Badge key={m} variant="secondary" className="text-xs">{m.toUpperCase()}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {planos.length === 0 && <p className="col-span-3 text-center text-muted-foreground py-8">Nenhum plano cadastrado</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB ASSINATURAS ─── */}
        <TabsContent value="assinaturas">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Assinaturas</CardTitle>
              <Button size="sm" onClick={() => { setFormAssinatura({ empresa_id: '', plano_id: '', data_inicio: new Date().toISOString().split('T')[0] }); setAssinaturaDialog(true); }}><Plus className="h-4 w-4 mr-1" />Nova Assinatura</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left font-medium">Empresa</th><th className="p-3 text-left font-medium">Plano</th><th className="p-3 text-left font-medium">Status</th><th className="p-3 text-left font-medium">Início</th><th className="p-3 text-left font-medium">Fim</th><th className="p-3 text-left font-medium">Ações</th></tr></thead>
                  <tbody>
                    {assinaturas.map(a => (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{getEmpresaNome(a.empresa_id)}</td>
                        <td className="p-3"><Badge variant="outline">{getPlanoNome(a.plano_id)}</Badge></td>
                        <td className="p-3"><Badge variant={a.status === 'ATIVA' ? 'default' : 'secondary'}>{a.status}</Badge></td>
                        <td className="p-3 text-xs">{new Date(a.data_inicio).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-xs">{a.data_fim ? new Date(a.data_fim).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="p-3">
                          {a.status === 'ATIVA' && <Button size="sm" variant="destructive" onClick={() => cancelarAssinatura(a)}>Cancelar</Button>}
                        </td>
                      </tr>
                    ))}
                    {assinaturas.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma assinatura</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB USUÁRIOS ─── */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Usuários do Sistema</CardTitle>
              <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8 w-48" value={searchUsuarios} onChange={e => setSearchUsuarios(e.target.value)} /></div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50"><th className="p-3 text-left font-medium">Nome</th><th className="p-3 text-left font-medium">Role</th><th className="p-3 text-left font-medium">Empresa</th><th className="p-3 text-left font-medium">Cadastro</th><th className="p-3 text-left font-medium">Ações</th></tr></thead>
                  <tbody>
                    {filteredProfiles.map(p => (
                      <tr key={p.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{p.nome}</td>
                        <td className="p-3"><Badge variant={roleColor(getRole(p.id))}>{getRole(p.id)}</Badge></td>
                        <td className="p-3 text-xs">{getEmpresaNome(p.empresa_id)}</td>
                        <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Select value={getRole(p.id)} onValueChange={v => changeRole(p.id, v)}>
                              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USUARIO">USUARIO</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                                <SelectItem value="MASTER_TI">MASTER_TI</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select value={p.empresa_id || 'none'} onValueChange={v => changeUserEmpresa(p.id, v === 'none' ? null : v)}>
                              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sem empresa</SelectItem>
                                {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProfiles.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB SISTEMA ─── */}
        <TabsContent value="sistema">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Informações do Sistema</CardTitle></CardHeader><CardContent className="space-y-3">
              {[
                ['Versão', 'PCM v4.0'],
                ['Backend', 'Lovable Cloud'],
                ['Banco de Dados', 'PostgreSQL'],
                ['Ambiente', 'Produção'],
                ['Empresa do Admin', minhaEmpresa?.nome || '-'],
                ['Admin Logado', user?.nome || '-'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium">{v}</span>
                </div>
              ))}
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Resumo de Dados</CardTitle></CardHeader><CardContent className="space-y-3">
              {[
                ['Total Empresas', stats.empresas],
                ['Total Usuários', stats.profiles],
                ['Total O.S', stats.os],
                ['Total Equipamentos', stats.equipamentos],
                ['Total Logs Auditoria', stats.auditoria],
                ['Planos Cadastrados', planos.length],
                ['Assinaturas Ativas', assinaturas.filter(a => a.status === 'ATIVA').length],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-bold text-primary">{v}</span>
                </div>
              ))}
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOG: EMPRESA ─── */}
      <Dialog open={empresaDialog} onOpenChange={setEmpresaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={formEmpresa.nome} onChange={e => setFormEmpresa(f => ({ ...f, nome: e.target.value }))} /></div>
            <div><Label>CNPJ</Label><Input value={formEmpresa.cnpj} onChange={e => setFormEmpresa(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Plano</Label>
              <Select value={formEmpresa.plano} onValueChange={v => setFormEmpresa(f => ({ ...f, plano: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASICO">Básico</SelectItem>
                  <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={saveEmpresa}>{editingEmpresa ? 'Atualizar' : 'Criar Empresa'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: PLANO ─── */}
      <Dialog open={planoDialog} onOpenChange={setPlanoDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPlano ? 'Editar Plano' : 'Novo Plano'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Nome *</Label><Input value={formPlano.nome} onChange={e => setFormPlano(f => ({ ...f, nome: e.target.value }))} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" value={formPlano.preco} onChange={e => setFormPlano(f => ({ ...f, preco: Number(e.target.value) }))} /></div>
              <div><Label>Máx Usuários</Label><Input type="number" value={formPlano.max_usuarios} onChange={e => setFormPlano(f => ({ ...f, max_usuarios: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <Label>Módulos Ativos</Label>
              <div className="flex justify-between mt-1 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFormPlano(f => ({ ...f, modulos_ativos: [...TODOS_MODULOS] }))}>Selecionar Todos</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setFormPlano(f => ({ ...f, modulos_ativos: [] }))}>Limpar</Button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {TODOS_MODULOS.map(m => (
                  <label key={m} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <input type="checkbox" checked={formPlano.modulos_ativos.includes(m)} onChange={() => toggleModulo(m)} className="rounded" />
                    {m.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={savePlano}>{editingPlano ? 'Atualizar' : 'Criar Plano'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG: ASSINATURA ─── */}
      <Dialog open={assinaturaDialog} onOpenChange={setAssinaturaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Assinatura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Empresa *</Label>
              <Select value={formAssinatura.empresa_id} onValueChange={v => setFormAssinatura(f => ({ ...f, empresa_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Plano *</Label>
              <Select value={formAssinatura.plano_id} onValueChange={v => setFormAssinatura(f => ({ ...f, plano_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} — R$ {Number(p.preco).toFixed(2)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Data Início</Label><Input type="date" value={formAssinatura.data_inicio} onChange={e => setFormAssinatura(f => ({ ...f, data_inicio: e.target.value }))} /></div>
            <Button className="w-full" onClick={saveAssinatura}>Criar Assinatura</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
