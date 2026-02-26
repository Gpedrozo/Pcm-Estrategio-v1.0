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
import { Loader2, Plus, Search, FileText, CheckCircle2, BookOpen, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { codigo: '', titulo: '', tipo: 'POP', descricao: '', versao: '1.0', responsavel: '' };

export default function DocumentosTecnicos() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { setIsLoading(true); const { data } = await fromEmpresa('documentos_tecnicos').order('codigo'); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('documentos_tecnicos', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Documento cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    let query = supabase.from('documentos_tecnicos').update(form).eq('id', selected.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Documento atualizado!' }); setDetailOpen(false); setEditMode(false); setSaving(false); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ codigo: item.codigo, titulo: item.titulo, tipo: item.tipo, descricao: item.descricao || '', versao: item.versao || '1.0', responsavel: item.responsavel || '' });
    setEditMode(false); setDetailOpen(true);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.codigo?.toLowerCase().includes(search.toLowerCase()) || i.titulo?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'TODOS' || i.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const stats = {
    total: items.length,
    vigentes: items.filter(i => i.status === 'VIGENTE').length,
    tipos: [...new Set(items.map(i => i.tipo))].length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Código *</Label><Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))} required /></div>
        <div className="space-y-2"><Label>Título *</Label><Input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="POP">POP</SelectItem><SelectItem value="MANUAL">Manual</SelectItem><SelectItem value="PROCEDIMENTO">Procedimento</SelectItem><SelectItem value="INSTRUCAO">Instrução de Trabalho</SelectItem><SelectItem value="CHECKLIST">Checklist</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Versão</Label><Input value={form.versao} onChange={e => setForm(p => ({ ...p, versao: e.target.value }))} /></div>
        <div className="space-y-2 col-span-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Documentos Técnicos</h1><p className="page-subtitle">Gestão de documentação técnica de manutenção</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Documento</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><FormFields /><Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button></form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Docs</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.vigentes}</p><p className="text-xs text-muted-foreground">Vigentes</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><FileText className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{stats.tipos}</p><p className="text-xs text-muted-foreground">Tipos</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por código ou título..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterTipo} onValueChange={setFilterTipo}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos Tipos</SelectItem><SelectItem value="POP">POP</SelectItem><SelectItem value="MANUAL">Manual</SelectItem><SelectItem value="PROCEDIMENTO">Procedimento</SelectItem><SelectItem value="INSTRUCAO">Instrução</SelectItem><SelectItem value="CHECKLIST">Checklist</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} documento(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Código</th><th>Título</th><th>Tipo</th><th>Versão</th><th>Responsável</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-mono font-bold text-primary">{e.codigo}</td><td className="font-medium">{e.titulo}</td>
            <td><Badge variant="outline">{e.tipo}</Badge></td><td className="font-mono">{e.versao}</td><td>{e.responsavel || '-'}</td>
            <td><Badge variant={e.status === 'VIGENTE' ? 'default' : 'secondary'}>{e.status}</Badge></td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openDetail(e); setEditMode(true); }}><Pencil className="h-4 w-4" /></Button>
              </div></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum documento</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.codigo}</span><span>{selected.titulo}</span><Badge variant={selected.status === 'VIGENTE' ? 'default' : 'secondary'} className="ml-auto">{selected.status}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4"><FormFields /><div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div></form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p><Badge variant="outline">{selected.tipo}</Badge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Versão</p><p className="text-lg font-mono font-bold">{selected.versao}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Cadastro</p><p className="text-sm">{new Date(selected.created_at).toLocaleString('pt-BR')}</p></div>
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</p><p className="text-sm">{selected.descricao || '-'}</p></div>
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
