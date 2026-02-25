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
import { Loader2, Plus, Search, ShieldAlert, AlertTriangle, CheckCircle2, Clock, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { tipo: 'INCIDENTE', descricao: '', local: '', gravidade: 'BAIXA', acao_tomada: '', responsavel: '' };

export default function SSMAPage() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { setIsLoading(true); const { data } = await fromEmpresa('ssma_registros').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('ssma_registros', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Registro SSMA cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const { error } = await supabase.from('ssma_registros').update(form).eq('id', selected.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Registro atualizado!' }); setSelected(null); setEditMode(false); setSaving(false); load();
  };

  const handleFechar = async (item: any) => {
    const { error } = await supabase.from('ssma_registros').update({ status: 'FECHADO' }).eq('id', item.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Registro fechado!' }); setSelected(null); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ tipo: item.tipo, descricao: item.descricao, local: item.local || '', gravidade: item.gravidade, acao_tomada: item.acao_tomada || '', responsavel: item.responsavel || '' });
    setEditMode(false);
  };

  const gravColor = (g: string) => g === 'CRITICA' || g === 'ALTA' ? 'destructive' : g === 'MEDIA' ? 'secondary' : 'outline';

  const filtered = items.filter(i => {
    const matchSearch = !search || i.descricao?.toLowerCase().includes(search.toLowerCase()) || i.local?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'TODOS' || i.tipo === filterTipo;
    const matchStatus = filterStatus === 'TODOS' || i.status === filterStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  const stats = {
    total: items.length,
    abertos: items.filter(i => i.status === 'ABERTO').length,
    criticos: items.filter(i => (i.gravidade === 'CRITICA' || i.gravidade === 'ALTA') && i.status === 'ABERTO').length,
    acidentes: items.filter(i => i.tipo === 'ACIDENTE').length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INCIDENTE">Incidente</SelectItem><SelectItem value="QUASE_ACIDENTE">Quase Acidente</SelectItem><SelectItem value="ACIDENTE">Acidente</SelectItem><SelectItem value="DESVIO">Desvio</SelectItem><SelectItem value="OBSERVACAO">Observação</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Gravidade</Label><Select value={form.gravidade} onValueChange={v => setForm(p => ({ ...p, gravidade: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CRITICA">Crítica</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Local</Label><Input value={form.local} onChange={e => setForm(p => ({ ...p, local: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Descrição *</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required /></div>
      <div className="space-y-2"><Label>Ação Tomada</Label><Textarea value={form.acao_tomada} onChange={e => setForm(p => ({ ...p, acao_tomada: e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">SSMA</h1><p className="page-subtitle">Segurança, Saúde e Meio Ambiente</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Registro</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Registro SSMA</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><FormFields /><Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Registrar</Button></form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ShieldAlert className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Registros</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.abertos}</p><p className="text-xs text-muted-foreground">Abertos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.criticos}</p><p className="text-xs text-muted-foreground">Críticos Abertos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><ShieldAlert className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.acidentes}</p><p className="text-xs text-muted-foreground">Acidentes</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterTipo} onValueChange={setFilterTipo}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos Tipos</SelectItem><SelectItem value="INCIDENTE">Incidente</SelectItem><SelectItem value="QUASE_ACIDENTE">Quase Acidente</SelectItem><SelectItem value="ACIDENTE">Acidente</SelectItem><SelectItem value="DESVIO">Desvio</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="ABERTO">Abertos</SelectItem><SelectItem value="FECHADO">Fechados</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} registro(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Tipo</th><th>Descrição</th><th>Local</th><th>Gravidade</th><th>Responsável</th><th>Status</th><th>Data</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td><Badge variant="outline">{e.tipo}</Badge></td><td className="max-w-[200px] truncate">{e.descricao}</td><td>{e.local || '-'}</td>
            <td><Badge variant={gravColor(e.gravidade) as any}>{e.gravidade}</Badge></td><td>{e.responsavel || '-'}</td>
            <td><Badge variant={e.status === 'FECHADO' ? 'default' : 'secondary'}>{e.status}</Badge></td>
            <td>{new Date(e.data_ocorrencia).toLocaleDateString('pt-BR')}</td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum registro</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) { setSelected(null); setEditMode(false); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><Badge variant="outline">{selected.tipo}</Badge><Badge variant={gravColor(selected.gravidade) as any}>{selected.gravidade}</Badge><Badge variant={selected.status === 'FECHADO' ? 'default' : 'secondary'} className="ml-auto">{selected.status}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4"><FormFields /><div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div></form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Local</p><p className="text-sm">{selected.local || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Data</p><p className="text-sm">{new Date(selected.data_ocorrencia).toLocaleDateString('pt-BR')}</p></div>
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</p><p className="text-sm">{selected.descricao}</p></div>
                  {selected.acao_tomada && <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Ação Tomada</p><p className="text-sm">{selected.acao_tomada}</p></div>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button>
                  {selected.status === 'ABERTO' && <Button variant="outline" onClick={() => handleFechar(selected)}>Fechar Registro</Button>}
                </div>
              </div>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
