import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Info, Shield, Server, Plus, RefreshCw, Trash2, Pencil, Loader2 } from 'lucide-react';

type ConfigType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

interface ConfigItem {
  id: string;
  empresa_id: string | null;
  categoria: string | null;
  chave: string;
  valor: unknown;
  tipo: string;
  descricao: string | null;
  editavel: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminConfig() {
  const { user } = useAuth();
  const { empresa } = useEmpresa();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [scope, setScope] = useState('GLOBAL');
  const [tableAvailable, setTableAvailable] = useState(true);
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    empresa_id: 'GLOBAL',
    categoria: 'GERAL',
    chave: '',
    tipo: 'STRING' as ConfigType,
    valor_texto: '',
    descricao: '',
    editavel: true,
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    const [empRes, cfgRes] = await Promise.all([
      supabase.from('empresas').select('id, nome').order('nome'),
      supabase.from('configuracoes_sistema').select('*').order('categoria').order('chave'),
    ]);

    setEmpresas(empRes.data || []);
    if (cfgRes.error) {
      setTableAvailable(false);
      setConfigs([]);
      setIsLoading(false);
      return;
    }

    setTableAvailable(true);
    setConfigs((cfgRes.data || []) as ConfigItem[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      empresa_id: 'GLOBAL',
      categoria: 'GERAL',
      chave: '',
      tipo: 'STRING',
      valor_texto: '',
      descricao: '',
      editavel: true,
    });
  };

  const parseValue = (tipo: ConfigType, valor: string): unknown => {
    if (tipo === 'STRING') return valor;
    if (tipo === 'NUMBER') {
      const n = Number(valor);
      if (Number.isNaN(n)) throw new Error('Valor numérico inválido');
      return n;
    }
    if (tipo === 'BOOLEAN') {
      const normalized = valor.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1') return true;
      if (normalized === 'false' || normalized === '0') return false;
      throw new Error('Para BOOLEAN use true/false');
    }
    try {
      return JSON.parse(valor || '{}');
    } catch {
      throw new Error('JSON inválido');
    }
  };

  const toText = (tipo: string, valor: unknown): string => {
    if (tipo === 'STRING') return String(valor ?? '');
    if (tipo === 'NUMBER') return String(valor ?? 0);
    if (tipo === 'BOOLEAN') return String(Boolean(valor));
    try {
      return JSON.stringify(valor ?? {}, null, 2);
    } catch {
      return '{}';
    }
  };

  const saveConfig = async () => {
    if (!form.chave.trim()) {
      toast({ title: 'Chave obrigatória', variant: 'destructive' });
      return;
    }

    let parsed: unknown;
    try {
      parsed = parseValue(form.tipo, form.valor_texto);
    } catch (e: any) {
      toast({ title: 'Valor inválido', description: e.message, variant: 'destructive' });
      return;
    }

    setSaving(true);
    const payload = {
      empresa_id: form.empresa_id === 'GLOBAL' ? null : form.empresa_id,
      categoria: form.categoria || null,
      chave: form.chave.trim(),
      tipo: form.tipo,
      valor: parsed as any,
      descricao: form.descricao || null,
      editavel: form.editavel,
    };

    const query = editing
      ? supabase.from('configuracoes_sistema').update(payload).eq('id', editing.id)
      : supabase.from('configuracoes_sistema').insert(payload);

    const { error } = await query;
    if (error) {
      toast({ title: 'Erro ao salvar configuração', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    toast({ title: editing ? 'Configuração atualizada' : 'Configuração criada' });
    setSaving(false);
    resetForm();
    load();
  };

  const removeConfig = async (item: ConfigItem) => {
    if (!confirm(`Excluir configuração "${item.chave}"?`)) return;
    const { error } = await supabase.from('configuracoes_sistema').delete().eq('id', item.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Configuração excluída' });
    if (editing?.id === item.id) resetForm();
    load();
  };

  const startEdit = (item: ConfigItem) => {
    setEditing(item);
    setForm({
      empresa_id: item.empresa_id || 'GLOBAL',
      categoria: item.categoria || 'GERAL',
      chave: item.chave,
      tipo: (item.tipo as ConfigType) || 'STRING',
      valor_texto: toText(item.tipo, item.valor),
      descricao: item.descricao || '',
      editavel: item.editavel,
    });
  };

  const filteredConfigs = useMemo(() => {
    if (scope === 'GLOBAL') return configs.filter((c) => c.empresa_id === null);
    if (scope === 'TODAS') return configs;
    return configs.filter((c) => c.empresa_id === scope);
  }, [configs, scope]);

  const sysInfo = [
    ['Versão do Sistema', 'PCM Estratégico v4.0'],
    ['Framework', 'React 18 + TypeScript + Vite'],
    ['UI Library', 'shadcn/ui + Tailwind CSS'],
    ['Backend', 'Lovable Cloud'],
    ['Banco de Dados', 'PostgreSQL (com RLS)'],
    ['Autenticação', 'Email/Senha (Lovable Cloud Auth)'],
    ['Ambiente', 'Produção'],
    ['Desenvolvido por', 'GPPIS Industrial Systems'],
  ];

  const security = [
    ['Row Level Security (RLS)', 'Ativo em todas as tabelas'],
    ['Isolamento Multi-Empresa', 'empresa_id em todas as tabelas operacionais'],
    ['Roles', 'USUARIO, SOLICITANTE, ADMIN, MASTER_TI'],
    ['Funções de Segurança', 'has_role(), get_user_empresa_id() — SECURITY DEFINER'],
    ['Auditoria', 'Registro automático de login/logout e ações'],
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <p className="text-sm text-muted-foreground">Informações técnicas e configurações gerais</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" />CRUD de configurações globais</CardTitle>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!tableAvailable && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              Tabela <strong>configuracoes_sistema</strong> não encontrada. Aplique a migration de fundação para habilitar o CRUD.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label>Escopo de visualização</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>Empresa da configuração</Label>
              <Select value={form.empresa_id} onValueChange={(v) => setForm((prev) => ({ ...prev, empresa_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1 space-y-1">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))} />
            </div>
            <div className="md:col-span-1 space-y-1">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((prev) => ({ ...prev, tipo: v as ConfigType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRING">STRING</SelectItem>
                  <SelectItem value="NUMBER">NUMBER</SelectItem>
                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Chave</Label>
              <Input value={form.chave} onChange={(e) => setForm((prev) => ({ ...prev, chave: e.target.value }))} placeholder="ex.: dashboard.refresh_interval" />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))} placeholder="Descrição opcional" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Valor</Label>
            <Textarea value={form.valor_texto} onChange={(e) => setForm((prev) => ({ ...prev, valor_texto: e.target.value }))} rows={4} placeholder={form.tipo === 'JSON' ? '{\n  "exemplo": true\n}' : 'Digite o valor'} />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.editavel} onCheckedChange={(v) => setForm((prev) => ({ ...prev, editavel: v }))} />
              Editável pelo admin
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetForm}>Limpar</Button>
              <Button onClick={saveConfig} disabled={saving || !tableAvailable}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {editing ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-2 text-left">Escopo</th>
                  <th className="p-2 text-left">Categoria</th>
                  <th className="p-2 text-left">Chave</th>
                  <th className="p-2 text-left">Tipo</th>
                  <th className="p-2 text-left">Valor</th>
                  <th className="p-2 text-left">Editável</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredConfigs.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="p-2 text-xs">{item.empresa_id ? (empresas.find((e) => e.id === item.empresa_id)?.nome || 'Empresa removida') : 'GLOBAL'}</td>
                    <td className="p-2">{item.categoria || '-'}</td>
                    <td className="p-2 font-mono text-xs">{item.chave}</td>
                    <td className="p-2"><Badge variant="outline">{item.tipo}</Badge></td>
                    <td className="p-2 max-w-[280px] truncate font-mono text-xs" title={toText(item.tipo, item.valor)}>{toText(item.tipo, item.valor)}</td>
                    <td className="p-2">{item.editavel ? 'Sim' : 'Não'}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => removeConfig(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredConfigs.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma configuração encontrada para o escopo selecionado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Sistema */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" />Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {sysInfo.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono font-medium text-xs">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Segurança</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {security.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono font-medium text-xs text-right max-w-[200px]">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Admin logado */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" />Administrador Logado</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Nome</span><span className="font-medium">{user?.nome}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Email</span><span className="font-mono text-xs">{user?.email}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Role</span><Badge variant="destructive">{user?.tipo}</Badge></div>
            <div className="flex justify-between py-2"><span className="text-muted-foreground">Empresa</span><span className="font-medium">{empresa?.nome || '-'}</span></div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings className="h-4 w-4" />Roadmap — Próximos Passos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { item: 'Portal de gestão separado (site externo)', status: 'Planejado' },
              { item: 'Integração com pagamentos (Stripe)', status: 'Futuro' },
              { item: 'Onboarding automatizado de empresas', status: 'Futuro' },
              { item: 'Relatórios gerenciais exportáveis', status: 'Futuro' },
              { item: 'Dashboard de saúde do banco de dados', status: 'Futuro' },
              { item: 'Notificações push / email', status: 'Futuro' },
            ].map(r => (
              <div key={r.item} className="flex justify-between py-2 border-b border-border last:border-0">
                <span>{r.item}</span>
                <Badge variant="outline" className="text-xs">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
