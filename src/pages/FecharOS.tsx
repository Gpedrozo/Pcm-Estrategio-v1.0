import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileCheck, Check, Wrench, Package, ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MODOS_FALHA = [
  'DESGASTE', 'FADIGA', 'CORROSAO', 'SOBRECARGA', 'DESALINHAMENTO',
  'LUBRIFICACAO_DEFICIENTE', 'CONTAMINACAO', 'ERRO_OPERACIONAL', 'FALTA_MANUTENCAO', 'OUTRO',
];
const CAUSAS_RAIZ_6M = [
  { value: 'MAO_OBRA', label: 'Mão de Obra' },
  { value: 'METODO', label: 'Método' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'MAQUINA', label: 'Máquina' },
  { value: 'MEIO_AMBIENTE', label: 'Meio Ambiente' },
  { value: 'MEDICAO', label: 'Medição' },
];

interface MaterialUsado { id: string; nome: string; codigo: string; custo_unitario: number; quantidade: number; }

export default function FecharOS() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fromEmpresa } = useEmpresaQuery();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [mecanicos, setMecanicos] = useState<any[]>([]);
  const [materiaisDisp, setMateriaisDisp] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('execucao');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [execForm, setExecForm] = useState({
    mecanicoId: '', horaInicio: '', horaFim: '', servicoExecutado: '', custoTerceiros: '',
  });
  const [rcaForm, setRcaForm] = useState({
    modoFalha: '', causaRaiz: '', acaoCorretiva: '', licoesAprendidas: '',
  });
  const [materiaisUsados, setMateriaisUsados] = useState<MaterialUsado[]>([]);
  const [matSel, setMatSel] = useState('');
  const [matQtd, setMatQtd] = useState('');

  useEffect(() => {
    Promise.all([
      fromEmpresa('ordens_servico').in('status', ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_MATERIAL', 'AGUARDANDO_APROVACAO']).order('created_at', { ascending: false }),
      fromEmpresa('mecanicos').eq('ativo', true).order('nome'),
      fromEmpresa('materiais').eq('ativo', true).order('codigo'),
    ]).then(([osRes, mecRes, matRes]) => {
      setOrdens(osRes.data || []);
      setMecanicos(mecRes.data || []);
      setMateriaisDisp(matRes.data || []);
      setIsLoading(false);
    });
  }, [fromEmpresa]);

  const selectedMecanico = mecanicos.find(m => m.id === execForm.mecanicoId);
  const isCorretiva = selectedOS?.tipo === 'CORRETIVA';

  const calcDuration = () => {
    if (!execForm.horaInicio || !execForm.horaFim) return 0;
    const [h1, m1] = execForm.horaInicio.split(':').map(Number);
    const [h2, m2] = execForm.horaFim.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return mins > 0 ? mins : 0;
  };

  const custoMateriais = materiaisUsados.reduce((t, m) => t + m.quantidade * m.custo_unitario, 0);

  const handleAddMaterial = () => {
    if (!matSel || !matQtd) return;
    const mat = materiaisDisp.find(m => m.id === matSel);
    if (!mat) return;
    const qty = parseFloat(matQtd);
    if (qty <= 0) return;
    const existing = materiaisUsados.findIndex(m => m.id === mat.id);
    if (existing >= 0) {
      const up = [...materiaisUsados];
      up[existing].quantidade += qty;
      setMateriaisUsados(up);
    } else {
      setMateriaisUsados([...materiaisUsados, { id: mat.id, nome: mat.nome, codigo: mat.codigo, custo_unitario: mat.custo_unitario, quantidade: qty }]);
    }
    setMatSel(''); setMatQtd('');
  };

  const handleSelectOS = (os: any) => {
    setSelectedOS(os);
    setActiveTab('execucao');
    setExecForm({ mecanicoId: '', horaInicio: '', horaFim: '', servicoExecutado: '', custoTerceiros: '' });
    setRcaForm({ modoFalha: '', causaRaiz: '', acaoCorretiva: '', licoesAprendidas: '' });
    setMateriaisUsados([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOS || !selectedMecanico) return;
    setIsSubmitting(true);

    try {
      const tempoExec = calcDuration();
      const custoMO = selectedMecanico.custo_hora ? (tempoExec / 60) * Number(selectedMecanico.custo_hora) : 0;
      const custoTerc = execForm.custoTerceiros ? parseFloat(execForm.custoTerceiros) : 0;
      const custoTotal = custoMO + custoMateriais + custoTerc;

      // Create execution record
      const { data: empresaData } = await supabase.from('profiles').select('empresa_id').eq('id', user!.id).maybeSingle();
      await supabase.from('execucoes_os').insert({
        os_id: selectedOS.id, mecanico_id: execForm.mecanicoId, mecanico_nome: selectedMecanico.nome,
        hora_inicio: execForm.horaInicio, hora_fim: execForm.horaFim, tempo_execucao: tempoExec,
        servico_executado: execForm.servicoExecutado, custo_mao_obra: custoMO, custo_materiais: custoMateriais,
        custo_terceiros: custoTerc, custo_total: custoTotal, empresa_id: empresaData?.empresa_id,
      });

      // Add materials
      for (const mat of materiaisUsados) {
        await supabase.from('materiais_utilizados').insert({
          execucao_id: selectedOS.id, material_id: mat.id, material_nome: mat.nome,
          quantidade: mat.quantidade, custo_unitario: mat.custo_unitario,
          custo_total: mat.quantidade * mat.custo_unitario, empresa_id: empresaData?.empresa_id,
        });
      }

      // Update OS
      await supabase.from('ordens_servico').update({
        status: 'FECHADA', data_fechamento: new Date().toISOString(), usuario_fechamento: user?.nome,
        modo_falha: isCorretiva ? rcaForm.modoFalha || null : null,
        causa_raiz: isCorretiva ? rcaForm.causaRaiz || null : null,
        acao_corretiva: isCorretiva ? rcaForm.acaoCorretiva || null : null,
        licoes_aprendidas: rcaForm.licoesAprendidas || null,
      }).eq('id', selectedOS.id);

      toast({ title: `O.S #${selectedOS.numero_os} fechada com sucesso!`, description: `Custo total: R$ ${custoTotal.toFixed(2)}` });
      navigate('/os/historico');
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Erro ao fechar O.S', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">Fechar Ordem de Serviço</h1>
        <p className="page-subtitle">Registre a execução, materiais e encerre a O.S</p>
      </div>

      {/* Select OS */}
      <Card className="card-industrial">
        <CardHeader><CardTitle className="text-base">Selecionar O.S</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
          {ordens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma O.S pendente</p>
          ) : ordens.map(os => (
            <button key={os.id} onClick={() => handleSelectOS(os)} className={`w-full text-left p-4 rounded-lg border transition-all ${selectedOS?.id === os.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono font-bold text-lg">{os.numero_os}</span>
                  <span className="font-mono text-primary font-medium">{os.tag}</span>
                  <Badge variant="outline">{os.tipo}</Badge>
                </div>
                {selectedOS?.id === os.id && <Check className="h-5 w-5 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{os.problema}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Execution Form */}
      {selectedOS && (
        <Card className="card-industrial">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" />Dados da Execução — O.S #{selectedOS.numero_os}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="execucao" className="gap-2"><Wrench className="h-4 w-4" />Execução</TabsTrigger>
                  <TabsTrigger value="materiais" className="gap-2"><Package className="h-4 w-4" />Materiais</TabsTrigger>
                  <TabsTrigger value="rca" className="gap-2"><ClipboardCheck className="h-4 w-4" />RCA</TabsTrigger>
                </TabsList>

                <TabsContent value="execucao" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mecânico *</Label>
                      <Select value={execForm.mecanicoId} onValueChange={v => setExecForm(p => ({...p, mecanicoId: v}))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{mecanicos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome} ({m.tipo === 'PROPRIO' ? 'Próprio' : 'Terc.'})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Hora Início *</Label><Input type="time" value={execForm.horaInicio} onChange={e => setExecForm(p => ({...p, horaInicio: e.target.value}))} required /></div>
                    <div className="space-y-2"><Label>Hora Fim *</Label><Input type="time" value={execForm.horaFim} onChange={e => setExecForm(p => ({...p, horaFim: e.target.value}))} required /></div>
                  </div>
                  {calcDuration() > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-success/10 rounded-lg text-sm">Tempo: <strong className="text-success">{Math.floor(calcDuration()/60)}h {calcDuration()%60}min</strong></div>
                      {selectedMecanico?.custo_hora && <div className="p-3 bg-info/10 rounded-lg text-sm">Custo MO: <strong className="text-info">{formatCurrency((calcDuration()/60) * Number(selectedMecanico.custo_hora))}</strong></div>}
                    </div>
                  )}
                  <div className="space-y-2"><Label>Serviço Executado *</Label><Textarea value={execForm.servicoExecutado} onChange={e => setExecForm(p => ({...p, servicoExecutado: e.target.value}))} rows={3} required /></div>
                  <div className="space-y-2"><Label>Custo Terceiros (R$)</Label><Input type="number" step="0.01" value={execForm.custoTerceiros} onChange={e => setExecForm(p => ({...p, custoTerceiros: e.target.value}))} /></div>
                </TabsContent>

                <TabsContent value="materiais" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={matSel} onValueChange={setMatSel}>
                      <SelectTrigger><SelectValue placeholder="Material" /></SelectTrigger>
                      <SelectContent>{materiaisDisp.filter(m => m.estoque_atual > 0).map(m => <SelectItem key={m.id} value={m.id}>{m.codigo} - {m.nome} (Est: {m.estoque_atual})</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" min="0.01" step="0.01" placeholder="Qtd" value={matQtd} onChange={e => setMatQtd(e.target.value)} />
                    <Button type="button" onClick={handleAddMaterial} variant="outline" className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
                  </div>
                  {materiaisUsados.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="table-industrial">
                        <thead><tr><th>Código</th><th>Material</th><th>Qtd</th><th>Unit.</th><th>Total</th><th></th></tr></thead>
                        <tbody>
                          {materiaisUsados.map((m, i) => (
                            <tr key={m.id}>
                              <td className="font-mono">{m.codigo}</td><td>{m.nome}</td>
                              <td>{m.quantidade}</td><td>{formatCurrency(m.custo_unitario)}</td>
                              <td className="font-medium">{formatCurrency(m.quantidade * m.custo_unitario)}</td>
                              <td><Button variant="ghost" size="icon" onClick={() => setMateriaisUsados(materiaisUsados.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                            </tr>
                          ))}
                          <tr><td colSpan={4} className="text-right font-semibold">Total Materiais:</td><td className="font-bold text-success">{formatCurrency(custoMateriais)}</td><td /></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="rca" className="space-y-4 mt-4">
                  {isCorretiva && (
                    <div className="p-3 bg-warning/10 rounded-lg text-sm text-warning flex items-center gap-2 mb-4">
                      <ClipboardCheck className="h-4 w-4" /> OS Corretiva — preenchimento de RCA recomendado.
                    </div>
                  )}
                  <div className="space-y-2"><Label>Modo de Falha</Label>
                    <Select value={rcaForm.modoFalha} onValueChange={v => setRcaForm(p => ({...p, modoFalha: v}))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{MODOS_FALHA.map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Causa Raiz (6M - Ishikawa)</Label>
                    <Select value={rcaForm.causaRaiz} onValueChange={v => setRcaForm(p => ({...p, causaRaiz: v}))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{CAUSAS_RAIZ_6M.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Ação Corretiva</Label><Textarea value={rcaForm.acaoCorretiva} onChange={e => setRcaForm(p => ({...p, acaoCorretiva: e.target.value}))} rows={3} /></div>
                  <div className="space-y-2"><Label>Lições Aprendidas</Label><Textarea value={rcaForm.licoesAprendidas} onChange={e => setRcaForm(p => ({...p, licoesAprendidas: e.target.value}))} rows={3} /></div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" className="flex-1 btn-industrial gap-2" disabled={isSubmitting || !execForm.mecanicoId || !execForm.horaInicio || !execForm.horaFim}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                  Fechar O.S
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
