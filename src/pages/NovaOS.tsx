import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FilePlus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link, useLocation } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type TipoOS = Database['public']['Enums']['tipo_os'];
type PrioridadeOS = Database['public']['Enums']['prioridade_os'];

export default function NovaOS() {
  const { user } = useAuth();
  const { fromEmpresa, empresaId } = useEmpresaQuery();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [solicitacoesAprovadas, setSolicitacoesAprovadas] = useState<any[]>([]);
  const [solicitacaoId, setSolicitacaoId] = useState<string>('none');
  const [form, setForm] = useState({
    tipo: 'CORRETIVA' as TipoOS, prioridade: 'MEDIA' as PrioridadeOS,
    tag: '', equipamento: '', solicitante: user?.nome || '', problema: '',
    area: '',
    impacto_producao: '',
    responsavel_planejamento: user?.nome || '',
    equipe_planejamento: '',
    data_programada: '',
    duracao_estimada: '',
    pecas_necessarias: '',
    ferramentas_necessarias: '',
    parada_programada: 'NAO',
    tempo_estimado: '',
    custo_estimado: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const [equipResult, solicitacoesResult] = await Promise.all([
        fromEmpresa('equipamentos').eq('ativo', true).order('tag'),
        fromEmpresa('solicitacoes').in('status', ['ABERTA', 'EM_ANALISE', 'APROVADA']).is('os_gerada_id', null).order('created_at', { ascending: false }),
      ]);

      setEquipamentos(equipResult.data || []);
      const aprovadas = solicitacoesResult.data || [];
      setSolicitacoesAprovadas(aprovadas);

      const stateSolicitacaoId = (location.state as { solicitacaoId?: string } | null)?.solicitacaoId;
      if (stateSolicitacaoId && aprovadas.some((s) => s.id === stateSolicitacaoId)) {
        setSolicitacaoId(stateSolicitacaoId);
        const selectedSolicitacao = aprovadas.find((s) => s.id === stateSolicitacaoId);
        if (selectedSolicitacao) {
          setForm((prev) => ({
            ...prev,
            prioridade: selectedSolicitacao.prioridade || prev.prioridade,
            tag: selectedSolicitacao.tag || prev.tag,
            equipamento: selectedSolicitacao.equipamento || prev.equipamento,
            solicitante: selectedSolicitacao.solicitante || prev.solicitante,
            problema: selectedSolicitacao.descricao || prev.problema,
            area: selectedSolicitacao.area || prev.area,
            impacto_producao: selectedSolicitacao.impacto_producao || prev.impacto_producao,
          }));
        }
      }
    };

    loadData();
  }, [fromEmpresa, location.state]);

  const handleTagChange = (tag: string) => {
    const equip = equipamentos.find(e => e.tag === tag);
    setForm(prev => ({ ...prev, tag, equipamento: equip?.nome || '' }));
  };

  const handleSolicitacaoChange = (value: string) => {
    setSolicitacaoId(value);
    if (value === 'none') return;
    const selected = solicitacoesAprovadas.find((s) => s.id === value);
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      prioridade: selected.prioridade || prev.prioridade,
      tag: selected.tag || prev.tag,
      equipamento: selected.equipamento || prev.equipamento,
      solicitante: selected.solicitante || prev.solicitante,
      problema: selected.descricao || prev.problema,
      area: selected.area || prev.area,
      impacto_producao: selected.impacto_producao || prev.impacto_producao,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data: osCriada, error } = await supabase.from('ordens_servico').insert({
        empresa_id: empresaId,
        origem_solicitacao_id: solicitacaoId !== 'none' ? solicitacaoId : null,
        tipo: form.tipo, prioridade: form.prioridade, tag: form.tag, equipamento: form.equipamento,
        solicitante: form.solicitante, problema: form.problema, area: form.area || null, impacto_producao: form.impacto_producao || null,
        responsavel_planejamento: form.responsavel_planejamento || null,
        equipe_planejamento: form.equipe_planejamento || null,
        data_programada: form.data_programada || null,
        duracao_estimada: form.duracao_estimada ? parseInt(form.duracao_estimada) : null,
        pecas_necessarias: form.pecas_necessarias || null,
        ferramentas_necessarias: form.ferramentas_necessarias || null,
        parada_programada: form.parada_programada === 'SIM',
        usuario_abertura_id: user?.id,
        usuario_abertura: user?.nome || 'Usuário',
        tempo_estimado: form.tempo_estimado ? parseInt(form.tempo_estimado) : null,
        custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : null,
      }).select('id').single();
      if (error) throw error;

      if (solicitacaoId !== 'none' && osCriada?.id) {
        const { error: solicitacaoError } = await supabase
          .from('solicitacoes')
          .update({ status: 'CONVERTIDA_OS', os_gerada_id: osCriada.id })
          .eq('id', solicitacaoId)
          .eq('empresa_id', empresaId);

        if (solicitacaoError) throw solicitacaoError;
      }

      toast({ title: 'O.S criada com sucesso!' });
      const [solicitacoesResult] = await Promise.all([
        fromEmpresa('solicitacoes').in('status', ['ABERTA', 'EM_ANALISE', 'APROVADA']).is('os_gerada_id', null).order('created_at', { ascending: false }),
      ]);
      setSolicitacoesAprovadas(solicitacoesResult.data || []);
      setSolicitacaoId('none');
      setForm({ tipo: 'CORRETIVA', prioridade: 'MEDIA', tag: '', equipamento: '', solicitante: user?.nome || '', problema: '', area: '', impacto_producao: '', responsavel_planejamento: user?.nome || '', equipe_planejamento: '', data_programada: '', duracao_estimada: '', pecas_necessarias: '', ferramentas_necessarias: '', parada_programada: 'NAO', tempo_estimado: '', custo_estimado: '' });
    } catch (error: any) {
      toast({ title: 'Erro ao criar O.S', description: error.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  if (user?.tipo === 'SOLICITANTE' || user?.tipo === 'USUARIO') {
    return (
      <div className="space-y-6">
        <div className="page-header"><h1 className="page-title">Emitir Ordem de Serviço</h1><p className="page-subtitle">Acesso restrito para este perfil</p></div>
        <Card className="card-industrial max-w-2xl"><CardContent className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Seu perfil não emite O.S. Neste fluxo, você pode aceitar e acompanhar solicitações.</p>
          <Button asChild className="btn-industrial w-fit"><Link to="/solicitacoes">Ir para Solicitações</Link></Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Emitir Ordem de Serviço</h1><p className="page-subtitle">Preencha os dados para criar uma nova O.S</p></div>
      <Card className="card-industrial max-w-3xl"><CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Solicitação aprovada (opcional)</Label>
            <Select value={solicitacaoId} onValueChange={handleSolicitacaoChange}>
              <SelectTrigger><SelectValue placeholder="Selecionar solicitação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem solicitação vinculada</SelectItem>
                {solicitacoesAprovadas.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.tag} • {s.solicitante} • {new Date(s.data_solicitacao || s.created_at).toLocaleDateString('pt-BR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm(prev => ({ ...prev, tipo: v as TipoOS }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CORRETIVA">Corretiva</SelectItem><SelectItem value="PREVENTIVA">Preventiva</SelectItem><SelectItem value="PREDITIVA">Preditiva</SelectItem><SelectItem value="INSPECAO">Inspeção</SelectItem><SelectItem value="MELHORIA">Melhoria</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => setForm(prev => ({ ...prev, prioridade: v as PrioridadeOS }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="URGENTE">Urgente</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>TAG do Equipamento</Label>
              <Select value={form.tag} onValueChange={handleTagChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{equipamentos.map(e => (<SelectItem key={e.id} value={e.tag}>{e.tag} - {e.nome}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} readOnly className="bg-muted" /></div>
            <div className="space-y-2"><Label>Solicitante</Label><Input value={form.solicitante} onChange={(e) => setForm(prev => ({ ...prev, solicitante: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Área</Label><Input value={form.area} onChange={(e) => setForm(prev => ({ ...prev, area: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Impacto na Produção</Label><Input value={form.impacto_producao} onChange={(e) => setForm(prev => ({ ...prev, impacto_producao: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Responsável Planejamento</Label><Input value={form.responsavel_planejamento} onChange={(e) => setForm(prev => ({ ...prev, responsavel_planejamento: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Equipe Planejamento</Label><Input value={form.equipe_planejamento} onChange={(e) => setForm(prev => ({ ...prev, equipe_planejamento: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Data Programada</Label><Input type="date" value={form.data_programada} onChange={(e) => setForm(prev => ({ ...prev, data_programada: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Duração Estimada (min)</Label><Input type="number" value={form.duracao_estimada} onChange={(e) => setForm(prev => ({ ...prev, duracao_estimada: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Parada Programada</Label>
              <Select value={form.parada_programada} onValueChange={(v) => setForm(prev => ({ ...prev, parada_programada: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SIM">Sim</SelectItem><SelectItem value="NAO">Não</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tempo Estimado (min)</Label><Input type="number" value={form.tempo_estimado} onChange={(e) => setForm(prev => ({ ...prev, tempo_estimado: e.target.value }))} /></div>
          </div>
          <div className="space-y-2"><Label>Descrição do Problema</Label><Textarea value={form.problema} onChange={(e) => setForm(prev => ({ ...prev, problema: e.target.value }))} required rows={4} placeholder="Descreva o problema detalhadamente..." /></div>
          <div className="space-y-2"><Label>Peças Necessárias</Label><Textarea value={form.pecas_necessarias} onChange={(e) => setForm(prev => ({ ...prev, pecas_necessarias: e.target.value }))} rows={2} /></div>
          <div className="space-y-2"><Label>Ferramentas Necessárias</Label><Textarea value={form.ferramentas_necessarias} onChange={(e) => setForm(prev => ({ ...prev, ferramentas_necessarias: e.target.value }))} rows={2} /></div>
          <Button type="submit" className="btn-industrial gap-2" disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}Criar Ordem de Serviço</Button>
        </form>
      </CardContent></Card>
    </div>
  );
}
