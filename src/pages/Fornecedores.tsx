import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, Building2, CheckCircle2, Phone, Mail, Eye, Pencil, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', especialidade: '' };

export default function Fornecedores() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
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
  const [contratosCount, setContratosCount] = useState<Record<string, number>>({});

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() {
    setIsLoading(true);
    const { data } = await fromEmpresa('fornecedores').order('nome');
    setItems(data || []);
    const { data: contratos } = await fromEmpresa('contratos').select('fornecedor_id');
    if (contratos) {
      const counts: Record<string, number> = {};
      contratos.forEach((c: any) => { if (c.fornecedor_id) counts[c.fornecedor_id] = (counts[c.fornecedor_id] || 0) + 1; });
      setContratosCount(counts);
    }
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('fornecedores', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Fornecedor cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const { error } = await supabase.from('fornecedores').update(form).eq('id', selected.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Fornecedor atualizado!' }); setDetailOpen(false); setEditMode(false); setSaving(false); load();
  };

  const handleToggleAtivo = async (item: any) => {
    const { error } = await supabase.from('fornecedores').update({ ativo: !item.ativo }).eq('id', item.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: item.ativo ? 'Fornecedor desativado' : 'Fornecedor ativado' }); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ nome: item.nome, cnpj: item.cnpj || '', contato: item.contato || '', telefone: item.telefone || '', email: item.email || '', endereco: item.endereco || '', especialidade: item.especialidade || '' });
    setEditMode(false); setDetailOpen(true);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.nome?.toLowerCase().includes(search.toLowerCase()) || i.cnpj?.includes(search) || i.especialidade?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || (filterStatus === 'ATIVO' ? i.ativo : !i.ativo);
    return matchSearch && matchStatus;
  });

  const stats = { total: items.length, ativos: items.filter(i => i.ativo).length, comContrato: Object.keys(contratosCount).length };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required /></div>
      <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></div>
      <div className="space-y-2"><Label>Contato</Label><Input value={form.contato} onChange={e => setForm(p => ({ ...p, contato: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Especialidade</Label><Input value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Fornecedores</h1><p className="page-subtitle">Gestão de fornecedores e prestadores</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Fornecedor</Button></DialogTrigger>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Cadastrar Fornecedor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><FormFields /><Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button></form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Building2 className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{stats.comContrato}</p><p className="text-xs text-muted-foreground">Com Contratos</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome, CNPJ ou especialidade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="TODOS">Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} fornecedor(es) encontrado(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Nome</th><th>CNPJ</th><th>Contato</th><th>Telefone</th><th>Especialidade</th><th>Contratos</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-medium">{e.nome}</td><td className="font-mono">{e.cnpj || '-'}</td><td>{e.contato || '-'}</td><td>{e.telefone || '-'}</td><td>{e.especialidade || '-'}</td>
            <td>{contratosCount[e.id] ? <Badge variant="outline" className="font-mono">{contratosCount[e.id]}</Badge> : <span className="text-muted-foreground">0</span>}</td>
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
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum fornecedor encontrado</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span>{selected.nome}</span>{selected.cnpj && <span className="font-mono text-sm text-muted-foreground">{selected.cnpj}</span>}<Badge variant={selected.ativo ? 'default' : 'secondary'} className="ml-auto">{selected.ativo ? 'Ativo' : 'Inativo'}</Badge></DialogTitle></DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4"><FormFields /><div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div></form>
            ) : (
              <Tabs defaultValue="dados" className="mt-4">
                <TabsList className="w-full"><TabsTrigger value="dados" className="flex-1">Contato</TabsTrigger><TabsTrigger value="info" className="flex-1">Informações</TabsTrigger></TabsList>
                <TabsContent value="dados" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Contato</p><p className="text-sm font-medium">{selected.contato || '-'}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Telefone</p><p className="text-sm font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{selected.telefone || '-'}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm font-medium flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email || '-'}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Especialidade</p><p className="text-sm font-medium">{selected.especialidade || '-'}</p></div>
                    <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Endereço</p><p className="text-sm font-medium">{selected.endereco || '-'}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Contratos Vinculados</p><p className="text-lg font-bold font-mono">{contratosCount[selected.id] || 0}</p></div>
                  </div>
                  <div className="flex gap-2 mt-4"><Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button><Button variant="outline" onClick={() => handleToggleAtivo(selected)}>{selected.ativo ? 'Desativar' : 'Ativar'}</Button></div>
                </TabsContent>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">ID</p><p className="text-sm font-mono">{selected.id}</p></div>
                    <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Cadastro</p><p className="text-sm">{new Date(selected.created_at).toLocaleString('pt-BR')}</p></div>
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
