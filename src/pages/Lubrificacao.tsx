import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, Droplets, AlertTriangle, CheckCircle2, Eye, Pencil, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { tag: '', equipamento: '', ponto: '', lubrificante: '', quantidade: '', periodicidade: 'MENSAL' as const, responsavel: '' };

export default function Lubrificacao() {
  const { fromEmpresa, insertWithEmpresa, empresaId } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() {
    setIsLoading(true);
    const [l, eq] = await Promise.all([fromEmpresa('lubrificacao').order('proxima_execucao'), fromEmpresa('equipamentos').eq('ativo', true).order('tag')]);
    setItems(l.data || []); setEquipamentos(eq.data || []); setIsLoading(false);
  }

  const handleTagChange = (tag: string) => { const eq = equipamentos.find(e => e.tag === tag); setForm(p => ({ ...p, tag, equipamento: eq?.nome || '' })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('lubrificacao', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Plano de lubrificação cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    let query = supabase
      .from('lubrificacao')
      .update({ ponto: form.ponto, lubrificante: form.lubrificante, quantidade: form.quantidade || null, periodicidade: form.periodicidade, responsavel: form.responsavel || null })
      .eq('id', selected.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Plano atualizado!' }); setDetailOpen(false); setEditMode(false); setSaving(false); load();
  };

  const handleToggleAtivo = async (item: any) => {
    let query = supabase.from('lubrificacao').update({ ativo: !item.ativo }).eq('id', item.id);
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { error } = await query;
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: item.ativo ? 'Plano desativado' : 'Plano ativado' }); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ tag: item.tag, equipamento: item.equipamento, ponto: item.ponto, lubrificante: item.lubrificante, quantidade: item.quantidade || '', periodicidade: item.periodicidade, responsavel: item.responsavel || '' });
    setEditMode(false); setDetailOpen(true);
  };

  const isOverdue = (d: string) => new Date(d) < new Date();
  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.equipamento?.toLowerCase().includes(search.toLowerCase()) || i.lubrificante?.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: items.length,
    ativos: items.filter(i => i.ativo).length,
    atrasados: items.filter(i => i.ativo && isOverdue(i.proxima_execucao)).length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Lubrificação</h1><p className="page-subtitle">Rotas e planos de lubrificação industrial</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Plano</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Plano de Lubrificação</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>TAG</Label><Select value={form.tag} onValueChange={handleTagChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{equipamentos.map(eq => <SelectItem key={eq.id} value={eq.tag}>{eq.tag} - {eq.nome}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} readOnly className="bg-muted" /></div>
                <div className="space-y-2"><Label>Ponto *</Label><Input value={form.ponto} onChange={e => setForm(p => ({ ...p, ponto: e.target.value }))} required placeholder="Ex: Mancal dianteiro" /></div>
                <div className="space-y-2"><Label>Lubrificante *</Label><Input value={form.lubrificante} onChange={e => setForm(p => ({ ...p, lubrificante: e.target.value }))} required placeholder="Ex: Graxa NLGI 2" /></div>
                <div className="space-y-2"><Label>Quantidade</Label><Input value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))} placeholder="Ex: 200ml" /></div>
                <div className="space-y-2"><Label>Periodicidade</Label><Select value={form.periodicidade} onValueChange={v => setForm(p => ({ ...p, periodicidade: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DIARIA">Diária</SelectItem><SelectItem value="SEMANAL">Semanal</SelectItem><SelectItem value="QUINZENAL">Quinzenal</SelectItem><SelectItem value="MENSAL">Mensal</SelectItem><SelectItem value="TRIMESTRAL">Trimestral</SelectItem><SelectItem value="SEMESTRAL">Semestral</SelectItem><SelectItem value="ANUAL">Anual</SelectItem></SelectContent></Select></div>
                <div className="space-y-2 col-span-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              </div>
              <Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button>
            </form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Droplets className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Rotas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativas</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.atrasados}</p><p className="text-xs text-muted-foreground">Atrasadas</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por TAG, equipamento ou lubrificante..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} rota(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>TAG</th><th>Equipamento</th><th>Ponto</th><th>Lubrificante</th><th>Periodicidade</th><th>Próxima</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-mono font-bold text-primary">{e.tag}</td><td>{e.equipamento}</td><td>{e.ponto}</td><td>{e.lubrificante}</td>
            <td><Badge variant="outline">{e.periodicidade}</Badge></td>
            <td className={isOverdue(e.proxima_execucao) ? 'text-destructive font-bold' : ''}>{new Date(e.proxima_execucao).toLocaleDateString('pt-BR')}</td>
            <td>{!e.ativo ? <Badge variant="secondary">Inativo</Badge> : isOverdue(e.proxima_execucao) ? <Badge variant="destructive">Atrasada</Badge> : <Badge variant="default">No Prazo</Badge>}</td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openDetail(e); setEditMode(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleAtivo(e)}>{e.ativo ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}</Button>
              </div></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma rota encontrada</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.tag}</span><span>{selected.ponto}</span></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Ponto</Label><Input value={form.ponto} onChange={e => setForm(p => ({ ...p, ponto: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Lubrificante</Label><Input value={form.lubrificante} onChange={e => setForm(p => ({ ...p, lubrificante: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Quantidade</Label><Input value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Periodicidade</Label><Select value={form.periodicidade} onValueChange={v => setForm(p => ({ ...p, periodicidade: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DIARIA">Diária</SelectItem><SelectItem value="SEMANAL">Semanal</SelectItem><SelectItem value="MENSAL">Mensal</SelectItem><SelectItem value="TRIMESTRAL">Trimestral</SelectItem><SelectItem value="ANUAL">Anual</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2 col-span-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Equipamento</p><p className="text-sm font-medium">{selected.equipamento}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Lubrificante</p><p className="text-sm font-bold">{selected.lubrificante}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Quantidade</p><p className="text-sm font-mono">{selected.quantidade || '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Periodicidade</p><Badge variant="outline">{selected.periodicidade}</Badge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Próxima</p><p className={`text-sm font-bold ${isOverdue(selected.proxima_execucao) ? 'text-destructive' : ''}`}>{new Date(selected.proxima_execucao).toLocaleDateString('pt-BR')}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Última</p><p className="text-sm">{selected.ultima_execucao ? new Date(selected.ultima_execucao).toLocaleDateString('pt-BR') : 'Nunca'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                </div>
                {isOverdue(selected.proxima_execucao) && selected.ativo && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Lubrificação atrasada!</div>}
                <div className="flex gap-2"><Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button><Button variant="outline" onClick={() => handleToggleAtivo(selected)}>{selected.ativo ? 'Desativar' : 'Ativar'}</Button></div>
              </div>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
