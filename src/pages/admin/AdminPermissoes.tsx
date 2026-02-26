import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, RefreshCw, UserCog } from 'lucide-react';
import { MODULE_OPTIONS } from '@/constants/modules';

const TODOS_MODULOS = MODULE_OPTIONS;
const PERM_FIELDS = [
  { key: 'visualizar', label: 'Visualizar' },
  { key: 'criar', label: 'Criar' },
  { key: 'editar', label: 'Editar' },
  { key: 'excluir', label: 'Excluir' },
  { key: 'alterar_status', label: 'Alterar Status' },
  { key: 'imprimir', label: 'Imprimir' },
  { key: 'exportar', label: 'Exportar' },
  { key: 'importar', label: 'Importar' },
  { key: 'acessar_indicadores', label: 'Indicadores' },
  { key: 'acessar_historico', label: 'Histórico' },
  { key: 'ver_valores', label: 'Valores' },
  { key: 'ver_custos', label: 'Custos' },
  { key: 'ver_criticidade', label: 'Criticidade' },
  { key: 'ver_status', label: 'Status' },
  { key: 'ver_obs_internas', label: 'Obs. Internas' },
  { key: 'ver_dados_financeiros', label: 'Dados Financeiros' },
] as const;

type PermField = typeof PERM_FIELDS[number]['key'];
type PermMap = Record<string, Record<PermField, boolean>>;

const makeDefaultPerm = (): Record<PermField, boolean> => ({
  visualizar: true,
  criar: false,
  editar: false,
  excluir: false,
  alterar_status: false,
  imprimir: false,
  exportar: false,
  importar: false,
  acessar_indicadores: false,
  acessar_historico: false,
  ver_valores: false,
  ver_custos: false,
  ver_criticidade: true,
  ver_status: true,
  ver_obs_internas: false,
  ver_dados_financeiros: false,
});

export default function AdminPermissoes() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [usuariosEmpresa, setUsuariosEmpresa] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [permissoes, setPermissoes] = useState<PermMap>({});
  const [loadingPermissoes, setLoadingPermissoes] = useState(false);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);
  const [permissionTableAvailable, setPermissionTableAvailable] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [e, p, a] = await Promise.all([
      supabase.from('empresas').select('*').order('nome'),
      supabase.from('planos_saas').select('*'),
      supabase.from('assinaturas').select('*').eq('status', 'ATIVA'),
    ]);
    setEmpresas(e.data || []);
    setPlanos(p.data || []);
    setAssinaturas(a.data || []);
    if ((e.data || []).length > 0 && !selectedEmpresa) {
      setSelectedEmpresa((e.data || [])[0].id);
    }
    setIsLoading(false);
  }, [selectedEmpresa]);

  useEffect(() => { load(); }, [load]);

  const loadUsuariosEmpresa = useCallback(async () => {
    if (!selectedEmpresa) {
      setUsuariosEmpresa([]);
      setSelectedUser('');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome')
      .eq('empresa_id', selectedEmpresa)
      .order('nome');

    if (error) {
      toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
      setUsuariosEmpresa([]);
      setSelectedUser('');
      return;
    }

    setUsuariosEmpresa(data || []);
    if ((data || []).length > 0) {
      setSelectedUser((prev) => prev || data![0].id);
    } else {
      setSelectedUser('');
    }
  }, [selectedEmpresa, toast]);

  useEffect(() => {
    loadUsuariosEmpresa();
  }, [loadUsuariosEmpresa]);

  const getEmpresaAssinatura = () => assinaturas.find(a => a.empresa_id === selectedEmpresa);
  const getPlano = (planoId: string) => planos.find(p => p.id === planoId);

  const currentAss = getEmpresaAssinatura();
  const currentPlano = currentAss ? getPlano(currentAss.plano_id) : null;
  const currentModulos: string[] = currentPlano?.modulos_ativos || [];

  const toggleModulo = async (modulo: string) => {
    if (!currentPlano) { toast({ title: 'Empresa sem plano ativo', variant: 'destructive' }); return; }
    const newModulos = currentModulos.includes(modulo)
      ? currentModulos.filter(m => m !== modulo)
      : [...currentModulos, modulo];
    await supabase.from('planos_saas').update({ modulos_ativos: newModulos }).eq('id', currentPlano.id);
    toast({ title: currentModulos.includes(modulo) ? `${modulo} desativado` : `${modulo} ativado` });
    load();
  };

  const ativarTodos = async () => {
    if (!currentPlano) return;
    await supabase.from('planos_saas').update({ modulos_ativos: [...TODOS_MODULOS] }).eq('id', currentPlano.id);
    toast({ title: 'Todos os módulos ativados' }); load();
  };

  const desativarTodos = async () => {
    if (!currentPlano) return;
    await supabase.from('planos_saas').update({ modulos_ativos: [] }).eq('id', currentPlano.id);
    toast({ title: 'Todos os módulos desativados' }); load();
  };

  const loadPermissoes = useCallback(async () => {
    if (!selectedUser) {
      setPermissoes({});
      return;
    }

    setLoadingPermissoes(true);
    const base: PermMap = {};
    TODOS_MODULOS.forEach((m) => {
      base[m] = makeDefaultPerm();
    });

    const { data, error } = await supabase
      .from('permissoes_granulares')
      .select('*')
      .eq('user_id', selectedUser);

    if (error) {
      setPermissionTableAvailable(false);
      setPermissoes(base);
      setLoadingPermissoes(false);
      return;
    }

    setPermissionTableAvailable(true);
    (data || []).forEach((row: any) => {
      const modulo = row.modulo;
      if (!base[modulo]) {
        base[modulo] = makeDefaultPerm();
      }
      PERM_FIELDS.forEach((field) => {
        base[modulo][field.key] = Boolean(row[field.key]);
      });
    });

    setPermissoes(base);
    setLoadingPermissoes(false);
  }, [selectedUser]);

  useEffect(() => {
    loadPermissoes();
  }, [loadPermissoes]);

  const togglePerm = (modulo: string, field: PermField) => {
    setPermissoes((prev) => ({
      ...prev,
      [modulo]: {
        ...(prev[modulo] || makeDefaultPerm()),
        [field]: !prev[modulo]?.[field],
      },
    }));
  };

  const toggleAllFields = (modulo: string, value: boolean) => {
    const all: Record<PermField, boolean> = { ...makeDefaultPerm() };
    PERM_FIELDS.forEach((field) => {
      all[field.key] = value;
    });
    setPermissoes((prev) => ({ ...prev, [modulo]: all }));
  };

  const salvarPermissoesUsuario = async () => {
    if (!selectedUser) return;
    setSalvandoPermissoes(true);

    const rows = Object.entries(permissoes).map(([modulo, fields]) => ({
      user_id: selectedUser,
      empresa_id: selectedEmpresa || null,
      modulo,
      ...fields,
    }));

    const { error: deleteError } = await supabase
      .from('permissoes_granulares')
      .delete()
      .eq('user_id', selectedUser);

    if (deleteError) {
      toast({ title: 'Erro ao limpar permissões atuais', description: deleteError.message, variant: 'destructive' });
      setSalvandoPermissoes(false);
      return;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('permissoes_granulares')
        .insert(rows as any);

      if (insertError) {
        toast({ title: 'Erro ao salvar permissões', description: insertError.message, variant: 'destructive' });
        setSalvandoPermissoes(false);
        return;
      }
    }

    toast({ title: 'Permissões salvas com sucesso' });
    setSalvandoPermissoes(false);
    loadPermissoes();
  };

  const selectedEmpresaData = empresas.find(e => e.id === selectedEmpresa);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Gerenciamento de Permissões</h1><p className="text-sm text-muted-foreground">Controle de módulos por empresa/plano</p></div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
      </div>

      {/* Seletor */}
      <Card><CardContent className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs text-muted-foreground mb-1">Selecione a empresa</p>
          <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {selectedEmpresaData && (
          <>
            <div className="text-sm">
              <span className="text-muted-foreground">Status:</span>{' '}
              <Badge variant={selectedEmpresaData.ativo ? 'default' : 'destructive'}>{selectedEmpresaData.ativo ? 'Ativo' : 'Bloqueado'}</Badge>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Plano:</span>{' '}
              <Badge variant="outline">{currentPlano?.nome || 'Sem plano'}</Badge>
            </div>
          </>
        )}
      </CardContent></Card>

      {/* Módulos */}
      {currentPlano ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5" />Módulos — {currentPlano.nome}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={ativarTodos}>Ativar Todos</Button>
              <Button size="sm" variant="outline" onClick={desativarTodos}>Desativar Todos</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TODOS_MODULOS.map(m => (
                <div key={m} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">{m.toUpperCase()}</span>
                  <Switch checked={currentModulos.includes(m)} onCheckedChange={() => toggleModulo(m)} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              ⚠️ Alterações nos módulos afetam o plano "{currentPlano.nome}" e todas as empresas que o utilizam.
              Para permissões individuais, crie um plano exclusivo para a empresa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          {selectedEmpresa ? 'Esta empresa não possui assinatura ativa. Crie uma assinatura primeiro.' : 'Selecione uma empresa para gerenciar permissões.'}
        </CardContent></Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2"><UserCog className="h-5 w-5" />Permissões granulares por usuário</CardTitle>
          <Button
            size="sm"
            onClick={salvarPermissoesUsuario}
            disabled={!selectedUser || salvandoPermissoes || !permissionTableAvailable}
          >
            {salvandoPermissoes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar permissões
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!permissionTableAvailable && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              Tabela <strong>permissoes_granulares</strong> não encontrada. Aplique a migration de fundação para habilitar esta funcionalidade.
            </div>
          )}

          <div className="max-w-md">
            <p className="text-xs text-muted-foreground mb-1">Usuário da empresa selecionada</p>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
              <SelectContent>
                {usuariosEmpresa.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!selectedUser ? (
            <p className="text-sm text-muted-foreground">Selecione um usuário para editar permissões detalhadas.</p>
          ) : loadingPermissoes ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {TODOS_MODULOS.map((modulo) => (
                <div key={modulo} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{modulo.toUpperCase()}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => toggleAllFields(modulo, true)}>Marcar todos</Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleAllFields(modulo, false)}>Limpar</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PERM_FIELDS.map((field) => (
                      <label key={field.key} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs">
                        <span>{field.label}</span>
                        <Switch
                          checked={Boolean(permissoes[modulo]?.[field.key])}
                          onCheckedChange={() => togglePerm(modulo, field.key)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
