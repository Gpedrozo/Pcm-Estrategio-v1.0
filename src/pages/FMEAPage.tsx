import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Activity, AlertTriangle, CheckCircle2, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { tag: '', componente: '', modo_falha: '', efeito_falha: '', causa_potencial: '', severidade: 5, ocorrencia: 5, deteccao: 5, acao_recomendada: '', responsavel: '' };

export default function FMEAPage() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisco, setFilterRisco] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() {
    setIsLoading(true);
    const [f, eq] = await Promise.all([fromEmpresa('fmea').order('rpn', { ascending: false }), fromEmpresa('equipamentos').eq('ativo', true).order('tag')]);
    setItems(f.data || []); setEquipamentos(eq.data || []); setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const rpn = form.severidade * form.ocorrencia * form.deteccao;
    const { error } = await insertWithEmpresa('fmea', { ...form, rpn });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'FMEA cadastrada!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const rpn = form.severidade * form.ocorrencia * form.deteccao;
    let query = supabase.from('fmea').update({ ...form, rpn }).eq('id', selected.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'FMEA atualizada!' }); setSelected(null); setEditMode(false); setSaving(false); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ tag: item.tag, componente: item.componente, modo_falha: item.modo_falha, efeito_falha: item.efeito_falha, causa_potencial: item.causa_potencial, severidade: item.severidade, ocorrencia: item.ocorrencia, deteccao: item.deteccao, acao_recomendada: item.acao_recomendada || '', responsavel: item.responsavel || '' });
    setEditMode(false);
  };

  const rpnColor = (rpn: number) => rpn >= 200 ? 'destructive' : rpn >= 100 ? 'secondary' : 'default';
  const rpnLabel = (rpn: number) => rpn >= 200 ? 'CRÍTICO' : rpn >= 100 ? 'ALTO' : rpn >= 50 ? 'MÉDIO' : 'BAIXO';

  const filtered = items.filter(i => {
    const matchSearch = !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.componente?.toLowerCase().includes(search.toLowerCase()) || i.modo_falha?.toLowerCase().includes(search.toLowerCase());
    const matchRisco = filterRisco === 'TODOS' || (filterRisco === 'CRITICO' ? i.rpn >= 200 : filterRisco === 'ALTO' ? i.rpn >= 100 && i.rpn < 200 : i.rpn < 100);
    return matchSearch && matchRisco;
  });

  const stats = {
    total: items.length,
    criticos: items.filter(i => i.rpn >= 200).length,
    altos: items.filter(i => i.rpn >= 100 && i.rpn < 200).length,
    rpnMedio: items.length > 0 ? Math.round(items.reduce((s, i) => s + i.rpn, 0) / items.length) : 0,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">FMEA / RCM</h1><p className="page-subtitle">Análise de Modos e Efeitos de Falha</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova FMEA</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Análise FMEA</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>TAG</Label><Select value={form.tag} onValueChange={v => setForm(p => ({ ...p, tag: v }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{equipamentos.map(eq => <SelectItem key={eq.id} value={eq.tag}>{eq.tag} - {eq.nome}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Componente *</Label><Input value={form.componente} onChange={e => setForm(p => ({ ...p, componente: e.target.value }))} required /></div>
              </div>
              <div className="space-y-2"><Label>Modo de Falha *</Label><Input value={form.modo_falha} onChange={e => setForm(p => ({ ...p, modo_falha: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Efeito da Falha *</Label><Textarea value={form.efeito_falha} onChange={e => setForm(p => ({ ...p, efeito_falha: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Causa Potencial *</Label><Input value={form.causa_potencial} onChange={e => setForm(p => ({ ...p, causa_potencial: e.target.value }))} required /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Severidade (1-10)</Label><Input type="number" min={1} max={10} value={form.severidade} onChange={e => setForm(p => ({ ...p, severidade: +e.target.value }))} /></div>
                <div className="space-y-2"><Label>Ocorrência (1-10)</Label><Input type="number" min={1} max={10} value={form.ocorrencia} onChange={e => setForm(p => ({ ...p, ocorrencia: +e.target.value }))} /></div>
                <div className="space-y-2"><Label>Detecção (1-10)</Label><Input type="number" min={1} max={10} value={form.deteccao} onChange={e => setForm(p => ({ ...p, deteccao: +e.target.value }))} /></div>
              </div>
              <div className="p-3 bg-muted rounded-md text-center"><span className="text-sm text-muted-foreground">RPN = </span><span className="text-2xl font-bold">{form.severidade * form.ocorrencia * form.deteccao}</span><span className="text-sm text-muted-foreground ml-2">({rpnLabel(form.severidade * form.ocorrencia * form.deteccao)})</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Ação Recomendada</Label><Textarea value={form.acao_recomendada} onChange={e => setForm(p => ({ ...p, acao_recomendada: e.target.value }))} /></div>
              <Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button>
            </form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Análises</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.criticos}</p><p className="text-xs text-muted-foreground">RPN Crítico (≥200)</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><AlertTriangle className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.altos}</p><p className="text-xs text-muted-foreground">RPN Alto (100-199)</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Activity className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{stats.rpnMedio}</p><p className="text-xs text-muted-foreground">RPN Médio</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por TAG, componente ou modo de falha..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterRisco} onValueChange={setFilterRisco}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="CRITICO">Crítico (≥200)</SelectItem><SelectItem value="ALTO">Alto (100-199)</SelectItem><SelectItem value="BAIXO">Baixo (&lt;100)</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} análise(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>TAG</th><th>Componente</th><th>Modo de Falha</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Risco</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-mono font-bold text-primary">{e.tag}</td><td>{e.componente}</td><td className="max-w-[180px] truncate">{e.modo_falha}</td>
            <td className="font-mono text-center">{e.severidade}</td><td className="font-mono text-center">{e.ocorrencia}</td><td className="font-mono text-center">{e.deteccao}</td>
            <td><Badge variant={rpnColor(e.rpn) as any} className="font-mono font-bold">{e.rpn}</Badge></td>
            <td className="text-sm font-medium">{rpnLabel(e.rpn)}</td>
            <td><Badge variant="outline">{e.status}</Badge></td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button>
            </td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">Nenhuma análise</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) { setSelected(null); setEditMode(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.tag}</span><span>{selected.componente}</span><Badge variant={rpnColor(selected.rpn) as any} className="ml-auto font-mono">RPN {selected.rpn}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Modo de Falha</Label><Input value={form.modo_falha} onChange={e => setForm(p => ({ ...p, modo_falha: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Causa Potencial</Label><Input value={form.causa_potencial} onChange={e => setForm(p => ({ ...p, causa_potencial: e.target.value }))} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>S</Label><Input type="number" min={1} max={10} value={form.severidade} onChange={e => setForm(p => ({ ...p, severidade: +e.target.value }))} /></div>
                  <div className="space-y-2"><Label>O</Label><Input type="number" min={1} max={10} value={form.ocorrencia} onChange={e => setForm(p => ({ ...p, ocorrencia: +e.target.value }))} /></div>
                  <div className="space-y-2"><Label>D</Label><Input type="number" min={1} max={10} value={form.deteccao} onChange={e => setForm(p => ({ ...p, deteccao: +e.target.value }))} /></div>
                </div>
                <div className="p-3 bg-muted rounded-md text-center"><span className="text-sm text-muted-foreground">RPN = </span><span className="text-2xl font-bold">{form.severidade * form.ocorrencia * form.deteccao}</span></div>
                <div className="space-y-2"><Label>Ação Recomendada</Label><Textarea value={form.acao_recomendada} onChange={e => setForm(p => ({ ...p, acao_recomendada: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                <div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Modo de Falha</p><p className="text-sm font-medium">{selected.modo_falha}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Causa Potencial</p><p className="text-sm">{selected.causa_potencial}</p></div>
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Efeito da Falha</p><p className="text-sm">{selected.efeito_falha}</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-md">
                  <div className="text-center"><p className="text-xs text-muted-foreground">Severidade</p><p className="text-2xl font-bold font-mono">{selected.severidade}</p></div>
                  <div className="text-center"><p className="text-xs text-muted-foreground">Ocorrência</p><p className="text-2xl font-bold font-mono">{selected.ocorrencia}</p></div>
                  <div className="text-center"><p className="text-xs text-muted-foreground">Detecção</p><p className="text-2xl font-bold font-mono">{selected.deteccao}</p></div>
                  <div className="text-center"><p className="text-xs text-muted-foreground">RPN</p><p className="text-2xl font-bold font-mono">{selected.rpn}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selected.acao_recomendada && <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Ação Recomendada</p><p className="text-sm">{selected.acao_recomendada}</p></div>}
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p><Badge variant="outline">{selected.status}</Badge></div>
                </div>
                <Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button>
              </div>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
