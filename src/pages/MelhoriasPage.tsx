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
import { Loader2, Plus, Search, Lightbulb, CheckCircle2, DollarSign, Clock, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { titulo: '', descricao: '', area: '', tag: '', beneficio_esperado: '', custo_estimado: 0, responsavel: '', prioridade: 'MEDIA' };

export default function MelhoriasPage() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { setIsLoading(true); const { data } = await fromEmpresa('melhorias').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('melhorias', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Melhoria registrada!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const { error } = await supabase.from('melhorias').update(form).eq('id', selected.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Melhoria atualizada!' }); setSelected(null); setEditMode(false); setSaving(false); load();
  };

  const handleChangeStatus = async (item: any, status: string) => {
    const { error } = await supabase.from('melhorias').update({ status }).eq('id', item.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Status: ${status}` }); setSelected(null); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ titulo: item.titulo, descricao: item.descricao, area: item.area || '', tag: item.tag || '', beneficio_esperado: item.beneficio_esperado || '', custo_estimado: item.custo_estimado || 0, responsavel: item.responsavel || '', prioridade: item.prioridade });
    setEditMode(false);
  };

  const statusColor = (s: string) => s === 'CONCLUIDA' ? 'default' : s === 'EM_EXECUCAO' ? 'secondary' : 'outline';

  const filtered = items.filter(i => {
    const matchSearch = !search || i.titulo?.toLowerCase().includes(search.toLowerCase()) || i.area?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: items.length,
    emExecucao: items.filter(i => i.status === 'EM_EXECUCAO').length,
    concluidas: items.filter(i => i.status === 'CONCLUIDA').length,
    custoTotal: items.reduce((s, i) => s + (i.custo_estimado || 0), 0),
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Melhorias</h1><p className="page-subtitle">Projetos de melhoria contínua</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Melhoria</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Nova Melhoria</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Descrição *</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Área</Label><Input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
                <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Prioridade</Label><Select value={form.prioridade} onValueChange={v => setForm(p => ({ ...p, prioridade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Custo Estimado (R$)</Label><Input type="number" value={form.custo_estimado} onChange={e => setForm(p => ({ ...p, custo_estimado: +e.target.value }))} /></div>
                <div className="space-y-2"><Label>Benefício Esperado</Label><Input value={form.beneficio_esperado} onChange={e => setForm(p => ({ ...p, beneficio_esperado: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              </div>
              <Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Registrar</Button>
            </form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Lightbulb className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Projetos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.emExecucao}</p><p className="text-xs text-muted-foreground">Em Execução</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.concluidas}</p><p className="text-xs text-muted-foreground">Concluídas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">R$ {stats.custoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Investimento</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por título ou área..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="PROPOSTA">Proposta</SelectItem><SelectItem value="APROVADA">Aprovada</SelectItem><SelectItem value="EM_EXECUCAO">Em Execução</SelectItem><SelectItem value="CONCLUIDA">Concluída</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} projeto(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Título</th><th>Área</th><th>Prioridade</th><th>Custo</th><th>Responsável</th><th>Status</th><th>Data</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-medium">{e.titulo}</td><td>{e.area || '-'}</td>
            <td><Badge variant={e.prioridade === 'ALTA' ? 'destructive' : 'secondary'}>{e.prioridade}</Badge></td>
            <td className="font-mono">R$ {(e.custo_estimado || 0).toLocaleString('pt-BR')}</td><td>{e.responsavel || '-'}</td>
            <td><Badge variant={statusColor(e.status) as any}>{e.status}</Badge></td>
            <td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma melhoria</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) { setSelected(null); setEditMode(false); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span>{selected.titulo}</span><Badge variant={statusColor(selected.status) as any} className="ml-auto">{selected.status}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Área</Label><Input value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Prioridade</Label><Select value={form.prioridade} onValueChange={v => setForm(p => ({ ...p, prioridade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Custo (R$)</Label><Input type="number" value={form.custo_estimado} onChange={e => setForm(p => ({ ...p, custo_estimado: +e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                  <div className="space-y-2 col-span-2"><Label>Benefício</Label><Input value={form.beneficio_esperado} onChange={e => setForm(p => ({ ...p, beneficio_esperado: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Área</p><p className="text-sm">{selected.area || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade</p><Badge variant={selected.prioridade === 'ALTA' ? 'destructive' : 'secondary'}>{selected.prioridade}</Badge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Custo Estimado</p><p className="text-lg font-bold font-mono">R$ {(selected.custo_estimado || 0).toLocaleString('pt-BR')}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</p><p className="text-sm">{selected.descricao}</p></div>
                  {selected.beneficio_esperado && <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Benefício Esperado</p><p className="text-sm">{selected.beneficio_esperado}</p></div>}
                  {selected.tag && <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">TAG</p><p className="text-sm font-mono">{selected.tag}</p></div>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button>
                  {selected.status === 'PROPOSTA' && <Button variant="outline" onClick={() => handleChangeStatus(selected, 'APROVADA')}>Aprovar</Button>}
                  {selected.status === 'APROVADA' && <Button variant="outline" onClick={() => handleChangeStatus(selected, 'EM_EXECUCAO')}>Iniciar Execução</Button>}
                  {selected.status === 'EM_EXECUCAO' && <Button variant="outline" onClick={() => handleChangeStatus(selected, 'CONCLUIDA')}>Concluir</Button>}
                </div>
              </div>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
