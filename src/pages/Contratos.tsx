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
import { Loader2, Plus, Search, FileText, DollarSign, CheckCircle2, AlertTriangle, Eye, Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { numero: '', fornecedor_nome: '', descricao: '', valor: 0, data_inicio: '', data_fim: '' };

export default function Contratos() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { setIsLoading(true); const { data } = await fromEmpresa('contratos').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload: any = { ...form };
    if (!payload.data_inicio) delete payload.data_inicio;
    if (!payload.data_fim) delete payload.data_fim;
    const { error } = await insertWithEmpresa('contratos', payload);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Contrato cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const payload: any = { ...form };
    if (!payload.data_inicio) payload.data_inicio = null;
    if (!payload.data_fim) payload.data_fim = null;
    let query = supabase.from('contratos').update(payload).eq('id', selected.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Contrato atualizado!' }); setDetailOpen(false); setEditMode(false); setSaving(false); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ numero: item.numero, fornecedor_nome: item.fornecedor_nome, descricao: item.descricao || '', valor: item.valor || 0, data_inicio: item.data_inicio || '', data_fim: item.data_fim || '' });
    setEditMode(false); setDetailOpen(true);
  };

  const isExpiring = (d: string | null) => { if (!d) return false; const diff = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24); return diff <= 30 && diff > 0; };
  const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false;

  const filtered = items.filter(i => {
    const matchSearch = !search || i.numero?.toLowerCase().includes(search.toLowerCase()) || i.fornecedor_nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: items.length,
    ativos: items.filter(i => i.status === 'ATIVO').length,
    valorTotal: items.filter(i => i.status === 'ATIVO').reduce((s, i) => s + (i.valor || 0), 0),
    vencendo: items.filter(i => i.status === 'ATIVO' && isExpiring(i.data_fim)).length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Número *</Label><Input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Fornecedor *</Label><Input value={form.fornecedor_nome} onChange={e => setForm(p => ({ ...p, fornecedor_nome: e.target.value }))} required /></div>
        <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: +e.target.value }))} /></div>
        <div className="space-y-2"><Label>Início</Label><Input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Fim</Label><Input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} /></div>
      </div>
      <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Contratos</h1><p className="page-subtitle">Gestão de contratos de manutenção e serviços</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Contrato</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><FormFields /><Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button></form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><DollarSign className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">R$ {stats.valorTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Valor Ativo</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.vencendo}</p><p className="text-xs text-muted-foreground">Vencendo em 30d</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por número ou fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="ATIVO">Ativos</SelectItem><SelectItem value="ENCERRADO">Encerrados</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} contrato(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Número</th><th>Fornecedor</th><th>Valor</th><th>Início</th><th>Fim</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-mono font-bold text-primary">{e.numero}</td><td className="font-medium">{e.fornecedor_nome}</td>
            <td className="font-mono">R$ {(e.valor || 0).toLocaleString('pt-BR')}</td>
            <td>{e.data_inicio ? new Date(e.data_inicio).toLocaleDateString('pt-BR') : '-'}</td>
            <td className={isExpiring(e.data_fim) ? 'text-warning font-bold' : isExpired(e.data_fim) ? 'text-destructive font-bold' : ''}>{e.data_fim ? new Date(e.data_fim).toLocaleDateString('pt-BR') : '-'}</td>
            <td><Badge variant={e.status === 'ATIVO' ? 'default' : 'secondary'}>{e.status}</Badge></td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openDetail(e); setEditMode(true); }}><Pencil className="h-4 w-4" /></Button>
              </div></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum contrato</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.numero}</span><span>{selected.fornecedor_nome}</span><Badge variant={selected.status === 'ATIVO' ? 'default' : 'secondary'} className="ml-auto">{selected.status}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4"><FormFields /><div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div></form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Valor</p><p className="text-xl font-bold font-mono">R$ {(selected.valor || 0).toLocaleString('pt-BR')}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Vigência</p><p className="text-sm">{selected.data_inicio ? new Date(selected.data_inicio).toLocaleDateString('pt-BR') : '-'} a {selected.data_fim ? new Date(selected.data_fim).toLocaleDateString('pt-BR') : '-'}</p></div>
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Descrição</p><p className="text-sm">{selected.descricao || '-'}</p></div>
                </div>
                {isExpiring(selected.data_fim) && <div className="p-3 bg-warning/10 border border-warning/20 rounded-md text-warning text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Contrato vencendo em menos de 30 dias!</div>}
                {isExpired(selected.data_fim) && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Contrato vencido!</div>}
                <Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button>
              </div>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
