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
import { Loader2, Plus, Search, Microscope, AlertTriangle, CheckCircle2, Clock, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { tag: '', equipamento: '', descricao_falha: '', metodo: '5_PORQUES', porque_1: '', porque_2: '', porque_3: '', porque_4: '', porque_5: '', causa_raiz_identificada: '', acao_corretiva: '', responsavel: '' };

export default function RCAPage() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() {
    setIsLoading(true);
    const [r, eq] = await Promise.all([fromEmpresa('analise_causa_raiz').order('created_at', { ascending: false }), fromEmpresa('equipamentos').eq('ativo', true).order('tag')]);
    setItems(r.data || []); setEquipamentos(eq.data || []); setIsLoading(false);
  }

  const handleTagChange = (tag: string) => { const eq = equipamentos.find(e => e.tag === tag); setForm(p => ({ ...p, tag, equipamento: eq?.nome || '' })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('analise_causa_raiz', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Análise registrada!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    let query = supabase.from('analise_causa_raiz').update(form).eq('id', selected.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Análise atualizada!' }); setSelected(null); setEditMode(false); setSaving(false); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ tag: item.tag, equipamento: item.equipamento, descricao_falha: item.descricao_falha, metodo: item.metodo, porque_1: item.porque_1 || '', porque_2: item.porque_2 || '', porque_3: item.porque_3 || '', porque_4: item.porque_4 || '', porque_5: item.porque_5 || '', causa_raiz_identificada: item.causa_raiz_identificada || '', acao_corretiva: item.acao_corretiva || '', responsavel: item.responsavel || '' });
    setEditMode(false);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.descricao_falha?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: items.length,
    emAnalise: items.filter(i => i.status === 'EM_ANALISE').length,
    concluidas: items.filter(i => i.status === 'CONCLUIDA').length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Análise de Causa Raiz</h1><p className="page-subtitle">Método 5 Porquês e Ishikawa</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Análise</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Análise de Causa Raiz</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>TAG</Label><Select value={form.tag} onValueChange={handleTagChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{equipamentos.map(eq => <SelectItem key={eq.id} value={eq.tag}>{eq.tag} - {eq.nome}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} readOnly className="bg-muted" /></div>
              </div>
              <div className="space-y-2"><Label>Descrição da Falha *</Label><Textarea value={form.descricao_falha} onChange={e => setForm(p => ({ ...p, descricao_falha: e.target.value }))} required /></div>
              <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                <p className="text-sm font-semibold text-muted-foreground">5 Porquês</p>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="space-y-1"><Label className="text-xs">{n}º Por quê?</Label><Input value={(form as any)[`porque_${n}`]} onChange={e => setForm(p => ({ ...p, [`porque_${n}`]: e.target.value }))} placeholder={`Resposta ${n}...`} /></div>
                ))}
              </div>
              <div className="space-y-2"><Label>Causa Raiz Identificada</Label><Textarea value={form.causa_raiz_identificada} onChange={e => setForm(p => ({ ...p, causa_raiz_identificada: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Ação Corretiva</Label><Textarea value={form.acao_corretiva} onChange={e => setForm(p => ({ ...p, acao_corretiva: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              <Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Registrar</Button>
            </form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Microscope className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Análises</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.emAnalise}</p><p className="text-xs text-muted-foreground">Em Análise</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.concluidas}</p><p className="text-xs text-muted-foreground">Concluídas</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por TAG ou falha..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="EM_ANALISE">Em Análise</SelectItem><SelectItem value="CONCLUIDA">Concluída</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} análise(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>TAG</th><th>Equipamento</th><th>Falha</th><th>Causa Raiz</th><th>Responsável</th><th>Status</th><th>Data</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-mono font-bold text-primary">{e.tag}</td><td>{e.equipamento}</td>
            <td className="max-w-[200px] truncate">{e.descricao_falha}</td><td className="max-w-[200px] truncate">{e.causa_raiz_identificada || <span className="text-muted-foreground italic">Pendente</span>}</td>
            <td>{e.responsavel || '-'}</td>
            <td><Badge variant={e.status === 'CONCLUIDA' ? 'default' : 'secondary'}>{e.status === 'EM_ANALISE' ? 'Em Análise' : 'Concluída'}</Badge></td>
            <td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma análise</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) { setSelected(null); setEditMode(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.tag}</span><span>{selected.equipamento}</span><Badge variant={selected.status === 'CONCLUIDA' ? 'default' : 'secondary'} className="ml-auto">{selected.status === 'EM_ANALISE' ? 'Em Análise' : 'Concluída'}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                <div className="space-y-2"><Label>Descrição da Falha</Label><Textarea value={form.descricao_falha} onChange={e => setForm(p => ({ ...p, descricao_falha: e.target.value }))} /></div>
                <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                  <p className="text-sm font-semibold text-muted-foreground">5 Porquês</p>
                  {[1, 2, 3, 4, 5].map(n => <div key={n} className="space-y-1"><Label className="text-xs">{n}º Por quê?</Label><Input value={(form as any)[`porque_${n}`]} onChange={e => setForm(p => ({ ...p, [`porque_${n}`]: e.target.value }))} /></div>)}
                </div>
                <div className="space-y-2"><Label>Causa Raiz</Label><Textarea value={form.causa_raiz_identificada} onChange={e => setForm(p => ({ ...p, causa_raiz_identificada: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Ação Corretiva</Label><Textarea value={form.acao_corretiva} onChange={e => setForm(p => ({ ...p, acao_corretiva: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                <div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição da Falha</p><p className="text-sm">{selected.descricao_falha}</p></div>
                <div className="space-y-3 p-4 bg-muted/50 rounded-md">
                  <p className="text-sm font-semibold">Análise 5 Porquês</p>
                  {[1, 2, 3, 4, 5].map(n => selected[`porque_${n}`] && <div key={n} className="space-y-1"><p className="text-xs text-muted-foreground">{n}º Por quê?</p><p className="text-sm pl-3 border-l-2 border-primary/30">{selected[`porque_${n}`]}</p></div>)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Causa Raiz Identificada</p><p className="text-sm font-bold">{selected.causa_raiz_identificada || <span className="text-muted-foreground italic">Pendente</span>}</p></div>
                  {selected.acao_corretiva && <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Ação Corretiva</p><p className="text-sm">{selected.acao_corretiva}</p></div>}
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Data</p><p className="text-sm">{new Date(selected.created_at).toLocaleString('pt-BR')}</p></div>
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
