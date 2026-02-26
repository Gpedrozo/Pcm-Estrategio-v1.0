import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Search, FileText, AlertTriangle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type StatusSolicitacao = 'ABERTA' | 'EM_ANALISE' | 'APROVADA' | 'REJEITADA' | 'CONVERTIDA_OS';

export default function Solicitacoes() {
  const { user, isAdmin } = useAuth();
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterVinculoOS, setFilterVinculoOS] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    tag: '',
    equipamento: '',
    area: '',
    descricao: '',
    impacto_producao: '',
    anexos_texto: '',
    solicitante: user?.nome || '',
    prioridade: 'MEDIA' as const,
  });
  const [triagem, setTriagem] = useState({
    prioridade_triagem: 'MEDIA',
    tipo_manutencao: 'CORRETIVA',
    triagem_observacoes: '',
    motivo_rejeicao: '',
  });

  useEffect(() => { load(); }, [fromEmpresa]);
  useEffect(() => {
    setForm((prev) => ({ ...prev, solicitante: user?.nome || prev.solicitante }));
  }, [user?.nome]);

  async function load() {
    setIsLoading(true);
    const solicitacoesQuery = fromEmpresa('solicitacoes').order('created_at', { ascending: false });
    const scopedSolicitacoes = user?.tipo === 'SOLICITANTE'
      ? solicitacoesQuery.eq('usuario_id', user.id)
      : solicitacoesQuery;

    const [sol, equip] = await Promise.all([
      scopedSolicitacoes,
      fromEmpresa('equipamentos').eq('ativo', true).order('tag'),
    ]);
    setItems(sol.data || []);
    setEquipamentos(equip.data || []);
    setIsLoading(false);
  }

  const handleTagChange = (tag: string) => {
    const eq = equipamentos.find(e => e.tag === tag);
    setForm(p => ({ ...p, tag, equipamento: eq?.nome || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const anexos = form.anexos_texto
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    const { error } = await insertWithEmpresa('solicitacoes', {
      tag: form.tag,
      equipamento: form.equipamento,
      area: form.area || null,
      descricao: form.descricao,
      impacto_producao: form.impacto_producao || null,
      anexos,
      solicitante: form.solicitante,
      prioridade: form.prioridade,
      status: 'ABERTA' as StatusSolicitacao,
      data_solicitacao: new Date().toISOString(),
      usuario_id: user?.id || null,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Solicitação registrada!' });
    setDialogOpen(false);
    setForm({
      tag: '',
      equipamento: '',
      area: '',
      descricao: '',
      impacto_producao: '',
      anexos_texto: '',
      solicitante: user?.nome || '',
      prioridade: 'MEDIA',
    });
    load();
  };

  const handleAprovarGerarOS = async (item: any) => {
    const prioridadeFinal = triagem.prioridade_triagem || item.prioridade || 'MEDIA';
    const tipoFinal = triagem.tipo_manutencao || 'CORRETIVA';

    const { error: aprovarError } = await supabase
      .from('solicitacoes')
      .update({
        status: 'APROVADA',
        prioridade_triagem: prioridadeFinal,
        tipo_manutencao: tipoFinal,
        triagem_observacoes: triagem.triagem_observacoes || null,
        analisado_por: user?.nome || 'Usuário',
        data_analise: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('empresa_id', empresaId);

    if (aprovarError) {
      toast({ title: 'Erro', description: aprovarError.message, variant: 'destructive' });
      return;
    }

    const { data: osCriada, error: osError } = await supabase
      .from('ordens_servico')
      .insert({
        empresa_id: empresaId,
        origem_solicitacao_id: item.id,
        tipo: tipoFinal,
        prioridade: prioridadeFinal,
        tag: item.tag,
        equipamento: item.equipamento,
        solicitante: item.solicitante,
        problema: item.descricao,
        area: item.area || null,
        impacto_producao: item.impacto_producao || null,
        usuario_abertura_id: user?.id,
        usuario_abertura: user?.nome || 'Usuário',
        status: 'ABERTA',
      })
      .select('id, numero_os')
      .single();

    if (osError || !osCriada?.id) {
      toast({ title: 'Erro', description: osError?.message || 'Falha ao gerar O.S', variant: 'destructive' });
      return;
    }

    const { error: vinculoError } = await supabase
      .from('solicitacoes')
      .update({ status: 'CONVERTIDA_OS', os_gerada_id: osCriada.id })
      .eq('id', item.id)
      .eq('empresa_id', empresaId);

    if (vinculoError) {
      toast({ title: 'Erro', description: vinculoError.message, variant: 'destructive' });
      return;
    }

    toast({ title: `Solicitação convertida na O.S #${osCriada.numero_os}` });
    setSelected(null);
    setTriagem({ prioridade_triagem: 'MEDIA', tipo_manutencao: 'CORRETIVA', triagem_observacoes: '', motivo_rejeicao: '' });
    load();
  };

  const handleRejeitar = async (item: any) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({
        status: 'REJEITADA',
        motivo_rejeicao: triagem.motivo_rejeicao || 'Não informado',
        triagem_observacoes: triagem.triagem_observacoes || null,
        analisado_por: user?.nome || 'Usuário',
        data_analise: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('empresa_id', empresaId);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Solicitação rejeitada' });
    setSelected(null);
    setTriagem({ prioridade_triagem: 'MEDIA', tipo_manutencao: 'CORRETIVA', triagem_observacoes: '', motivo_rejeicao: '' });
    load();
  };

  const filtered = items.filter(i => {
    const matchSearch = !search
      || i.tag?.toLowerCase().includes(search.toLowerCase())
      || i.descricao?.toLowerCase().includes(search.toLowerCase())
      || i.solicitante?.toLowerCase().includes(search.toLowerCase());
    const normalizedStatus = i.status === 'PENDENTE' ? 'ABERTA' : i.status === 'EM_OS' ? 'CONVERTIDA_OS' : i.status;
    const matchStatus = filterStatus === 'TODOS' || normalizedStatus === filterStatus;
    const matchVinculo = filterVinculoOS === 'TODOS'
      || (filterVinculoOS === 'COM_OS' && !!i.os_gerada_id)
      || (filterVinculoOS === 'SEM_OS' && !i.os_gerada_id);
    return matchSearch && matchStatus && matchVinculo;
  });

  const statusColor = (s: string) => s === 'ABERTA' || s === 'PENDENTE' ? 'secondary' : s === 'APROVADA' ? 'default' : s === 'REJEITADA' ? 'destructive' : 'outline';
  const statusLabel = (s: string) => {
    if (s === 'PENDENTE') return 'ABERTA';
    if (s === 'EM_OS') return 'CONVERTIDA_OS';
    return s;
  };
  const prioColor = (p: string) => p === 'URGENTE' || p === 'ALTA' ? 'destructive' : 'secondary';
  const canAprovarSolicitacao = isAdmin || user?.tipo === 'USUARIO';
  const stats = {
    total: items.length,
    pendentes: items.filter(i => ['ABERTA', 'PENDENTE', 'EM_ANALISE'].includes(i.status)).length,
    aprovadas: items.filter(i => ['APROVADA', 'CONVERTIDA_OS', 'EM_OS'].includes(i.status)).length,
    urgentes: items.filter(i => (i.prioridade === 'URGENTE' || i.prioridade === 'ALTA') && ['ABERTA', 'PENDENTE', 'EM_ANALISE'].includes(i.status)).length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Solicitações de Manutenção</h1><p className="page-subtitle">Fluxo: abertura, triagem e conversão automática em O.S.</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Solicitação</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Nova Solicitação</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>TAG do Equipamento</Label>
                  <Select value={form.tag} onValueChange={handleTagChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{equipamentos.map(eq => <SelectItem key={eq.id} value={eq.tag}>{eq.tag} - {eq.nome}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} readOnly className="bg-muted" /></div>
                <div className="space-y-2"><Label>Área</Label><Input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Solicitante</Label><Input value={form.solicitante} onChange={e => setForm(p => ({ ...p, solicitante: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Prioridade Inicial</Label>
                  <Select value={form.prioridade} onValueChange={v => setForm(p => ({ ...p, prioridade: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="URGENTE">Urgente</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Impacto na Produção</Label><Input value={form.impacto_producao} onChange={e => setForm(p => ({ ...p, impacto_producao: e.target.value }))} placeholder="Ex.: Linha parada parcial" /></div>
              </div>
              <div className="space-y-2"><Label>Descrição do Problema</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required rows={3} /></div>
              <div className="space-y-2"><Label>Anexos (URLs, uma por linha)</Label><Textarea value={form.anexos_texto} onChange={e => setForm(p => ({ ...p, anexos_texto: e.target.value }))} rows={2} /></div>
              <Button type="submit" className="btn-industrial w-full">Registrar</Button>
            </form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Abertas/Análise</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.aprovadas}</p><p className="text-xs text-muted-foreground">Aprovadas/Convertidas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.urgentes}</p><p className="text-xs text-muted-foreground">Urgentes Pendentes</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="ABERTA">Aberta</SelectItem><SelectItem value="EM_ANALISE">Em análise</SelectItem><SelectItem value="APROVADA">Aprovada</SelectItem><SelectItem value="REJEITADA">Rejeitada</SelectItem><SelectItem value="CONVERTIDA_OS">Convertida em O.S.</SelectItem></SelectContent></Select>
          <Select value={filterVinculoOS} onValueChange={setFilterVinculoOS}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="COM_OS">Com O.S</SelectItem><SelectItem value="SEM_OS">Sem O.S</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} solicitação(ões)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>TAG</th><th>Equipamento</th><th>Área</th><th>Descrição</th><th>Solicitante</th><th>Prioridade</th><th>Status</th><th>Data</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className={`cursor-pointer ${e.os_gerada_id ? 'bg-muted/40' : ''}`} onClick={() => setSelected(e)}>
            <td className="font-mono font-bold text-primary">{e.tag}</td><td>{e.equipamento}</td><td>{e.area || '-'}</td><td className="max-w-[200px] truncate">{e.descricao}</td><td>{e.solicitante}</td>
            <td><Badge variant={prioColor(e.prioridade) as any}>{e.prioridade}</Badge></td>
            <td>
              <div className="flex items-center gap-2">
                <Badge variant={statusColor(e.status) as any}>{statusLabel(e.status)}</Badge>
                {e.os_gerada_id && <Badge variant="outline">Com O.S</Badge>}
              </div>
            </td>
            <td>{new Date(e.data_solicitacao || e.created_at).toLocaleDateString('pt-BR')}</td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(e)}><Eye className="h-4 w-4" /></Button></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Nenhuma solicitação</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.tag}</span><span>{selected.equipamento}</span><Badge variant={statusColor(selected.status) as any} className="ml-auto">{statusLabel(selected.status)}</Badge></DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Solicitante</p><p className="text-sm font-medium">{selected.solicitante}</p></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade</p><Badge variant={prioColor(selected.prioridade) as any}>{selected.prioridade}</Badge></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Área</p><p className="text-sm">{selected.area || '-'}</p></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Impacto</p><p className="text-sm">{selected.impacto_producao || '-'}</p></div>
                <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</p><p className="text-sm">{selected.descricao}</p></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Data</p><p className="text-sm">{new Date(selected.data_solicitacao || selected.created_at).toLocaleString('pt-BR')}</p></div>
                {selected.os_gerada_id && <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">O.S Gerada</p><p className="text-sm font-mono">{selected.os_gerada_id}</p></div>}
              </div>

              {canAprovarSolicitacao && !selected.os_gerada_id && !['REJEITADA', 'CONVERTIDA_OS', 'EM_OS'].includes(selected.status) && (
                <div className="space-y-3 rounded-md border p-3">
                  <p className="text-sm font-medium">Triagem de Manutenção</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Prioridade da triagem</Label>
                      <Select value={triagem.prioridade_triagem} onValueChange={(value) => setTriagem((prev) => ({ ...prev, prioridade_triagem: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="URGENTE">Urgente</SelectItem>
                          <SelectItem value="ALTA">Alta</SelectItem>
                          <SelectItem value="MEDIA">Média</SelectItem>
                          <SelectItem value="BAIXA">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de manutenção</Label>
                      <Select value={triagem.tipo_manutencao} onValueChange={(value) => setTriagem((prev) => ({ ...prev, tipo_manutencao: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CORRETIVA">Corretiva</SelectItem>
                          <SelectItem value="PREVENTIVA">Preventiva</SelectItem>
                          <SelectItem value="PREDITIVA">Preditiva</SelectItem>
                          <SelectItem value="INSPECAO">Inspeção</SelectItem>
                          <SelectItem value="MELHORIA">Melhoria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Observações da triagem</Label>
                      <Textarea value={triagem.triagem_observacoes} onChange={(e) => setTriagem((prev) => ({ ...prev, triagem_observacoes: e.target.value }))} rows={2} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Motivo da rejeição (se aplicável)</Label>
                      <Textarea value={triagem.motivo_rejeicao} onChange={(e) => setTriagem((prev) => ({ ...prev, motivo_rejeicao: e.target.value }))} rows={2} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {canAprovarSolicitacao && !selected.os_gerada_id && !['REJEITADA', 'CONVERTIDA_OS', 'EM_OS'].includes(selected.status) && <Button onClick={() => handleAprovarGerarOS(selected)} className="btn-industrial gap-2"><CheckCircle2 className="h-4 w-4" />Aprovar e gerar O.S</Button>}
                {canAprovarSolicitacao && !selected.os_gerada_id && !['REJEITADA', 'CONVERTIDA_OS', 'EM_OS'].includes(selected.status) && (
                  <Button variant="destructive" onClick={() => handleRejeitar(selected)}>
                    Rejeitar
                  </Button>
                )}
              </div>
            </div>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
