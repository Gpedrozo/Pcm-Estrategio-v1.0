import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, Package, AlertTriangle, DollarSign, CheckCircle2, Eye, Pencil, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createEntity, loadEntityList, toggleEntityAtivo, updateEntityById } from '@/services/entityCrudService';

const FORM_INITIAL = { codigo: '', nome: '', unidade: 'UN', estoque_atual: 0, estoque_minimo: 0, custo_unitario: 0, localizacao: '' };

export default function Materiais() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstoque, setFilterEstoque] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() {
    setIsLoading(true);
    const { data } = await loadEntityList(fromEmpresa as any, 'materiais', 'codigo');
    setItems(data || []);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await createEntity(insertWithEmpresa as any, 'materiais', form as unknown as Record<string, unknown>);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Material cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const { error } = await updateEntityById('materiais', selected.id, form as unknown as Record<string, unknown>);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Material atualizado!' }); setDetailOpen(false); setEditMode(false); setSaving(false); load();
  };

  const handleToggleAtivo = async (item: any) => {
    const { error } = await toggleEntityAtivo('materiais', item.id, !!item.ativo);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: item.ativo ? 'Material desativado' : 'Material ativado' }); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ codigo: item.codigo, nome: item.nome, unidade: item.unidade, estoque_atual: item.estoque_atual, estoque_minimo: item.estoque_minimo, custo_unitario: item.custo_unitario, localizacao: item.localizacao || '' });
    setEditMode(false); setDetailOpen(true);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.codigo?.toLowerCase().includes(search.toLowerCase()) || i.nome?.toLowerCase().includes(search.toLowerCase());
    const matchEstoque = filterEstoque === 'TODOS' || (filterEstoque === 'BAIXO' ? i.estoque_atual <= i.estoque_minimo : i.estoque_atual > i.estoque_minimo);
    return matchSearch && matchEstoque;
  });

  const stats = {
    total: items.length,
    abaixoMinimo: items.filter(i => i.estoque_atual <= i.estoque_minimo && i.ativo).length,
    valorTotal: items.reduce((s, i) => s + (i.estoque_atual * i.custo_unitario), 0),
    ativos: items.filter(i => i.ativo).length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Código *</Label><Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value.toUpperCase() }))} required placeholder="Ex: ROL-001" /></div>
      <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Ex: Rolamento 6205" /></div>
      <div className="space-y-2"><Label>Unidade</Label><Input value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))} placeholder="UN, PC, KG, L..." /></div>
      <div className="space-y-2"><Label>Localização</Label><Input value={form.localizacao} onChange={e => setForm(p => ({ ...p, localizacao: e.target.value }))} placeholder="Almoxarifado, Prateleira..." /></div>
      <div className="space-y-2"><Label>Estoque Atual</Label><Input type="number" value={form.estoque_atual} onChange={e => setForm(p => ({ ...p, estoque_atual: +e.target.value }))} /></div>
      <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.estoque_minimo} onChange={e => setForm(p => ({ ...p, estoque_minimo: +e.target.value }))} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={form.custo_unitario} onChange={e => setForm(p => ({ ...p, custo_unitario: +e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Materiais e Peças</h1><p className="page-subtitle">Gestão de estoque e materiais de manutenção</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Material</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Cadastrar Material</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><FormFields /><Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button></form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Package className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Itens</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.abaixoMinimo}</p><p className="text-xs text-muted-foreground">Abaixo do Mínimo</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><DollarSign className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">R$ {stats.valorTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">Valor em Estoque</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por código ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={filterEstoque} onChange={e => setFilterEstoque(e.target.value)}>
            <option value="TODOS">Todos</option><option value="BAIXO">Abaixo do Mínimo</option><option value="OK">Estoque OK</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} material(is) encontrado(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Código</th><th>Nome</th><th>UN</th><th>Estoque</th><th>Mínimo</th><th>Custo UN</th><th>Localização</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-mono font-bold text-primary">{e.codigo}</td><td className="font-medium">{e.nome}</td><td>{e.unidade}</td>
            <td><span className={e.estoque_atual <= e.estoque_minimo ? 'text-destructive font-bold' : 'font-mono'}>{e.estoque_atual}</span></td>
            <td className="font-mono">{e.estoque_minimo}</td><td className="font-mono">R$ {(e.custo_unitario || 0).toFixed(2)}</td><td>{e.localizacao || '-'}</td>
            <td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(e)}><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openDetail(e); setEditMode(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleAtivo(e)}>{e.ativo ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}</Button>
              </div>
            </td>
          </tr>
        ))}
        {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Nenhum material encontrado</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.codigo}</span><span>{selected.nome}</span><Badge variant={selected.ativo ? 'default' : 'secondary'} className="ml-auto">{selected.ativo ? 'Ativo' : 'Inativo'}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4"><FormFields /><div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div></form>
            ) : (
              <Tabs defaultValue="dados" className="mt-4">
                <TabsList className="w-full"><TabsTrigger value="dados" className="flex-1">Estoque</TabsTrigger><TabsTrigger value="info" className="flex-1">Informações</TabsTrigger></TabsList>
                <TabsContent value="dados" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Estoque Atual</p><p className={`text-2xl font-bold font-mono ${selected.estoque_atual <= selected.estoque_minimo ? 'text-destructive' : ''}`}>{selected.estoque_atual} {selected.unidade}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Estoque Mínimo</p><p className="text-2xl font-bold font-mono">{selected.estoque_minimo} {selected.unidade}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Custo Unitário</p><p className="text-lg font-bold font-mono">R$ {(selected.custo_unitario || 0).toFixed(2)}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Valor Total</p><p className="text-lg font-bold font-mono">R$ {(selected.estoque_atual * selected.custo_unitario).toFixed(2)}</p></div>
                    <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Localização</p><p className="text-sm font-medium">{selected.localizacao || '-'}</p></div>
                  </div>
                  {selected.estoque_atual <= selected.estoque_minimo && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Estoque abaixo do mínimo! Necessário reposição.</div>}
                  <div className="flex gap-2 mt-4"><Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button><Button variant="outline" onClick={() => handleToggleAtivo(selected)}>{selected.ativo ? 'Desativar' : 'Ativar'}</Button></div>
                </TabsContent>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">ID</p><p className="text-sm font-mono">{selected.id}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Cadastro</p><p className="text-sm">{new Date(selected.created_at).toLocaleString('pt-BR')}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Atualização</p><p className="text-sm">{new Date(selected.updated_at).toLocaleString('pt-BR')}</p></div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
