import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, RefreshCw } from 'lucide-react';

const TODOS_MODULOS = [
  'DASHBOARD','SOLICITACOES','EMITIR_OS','FECHAR_OS','HISTORICO_OS',
  'BACKLOG','PROGRAMACAO','PREVENTIVA','PREDITIVA','INSPECOES',
  'FMEA','RCA','MELHORIAS','HIERARQUIA','EQUIPAMENTOS','MECANICOS',
  'MATERIAIS','FORNECEDORES','CONTRATOS','DOCUMENTOS','LUBRIFICACAO',
  'CUSTOS','RELATORIOS','SSMA','USUARIOS','AUDITORIA','ANALISE_IA',
];

export default function AdminPermissoes() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');

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
  }, []);

  useEffect(() => { load(); }, [load]);

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
                  <span className="text-sm font-medium">{m}</span>
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
    </div>
  );
}
