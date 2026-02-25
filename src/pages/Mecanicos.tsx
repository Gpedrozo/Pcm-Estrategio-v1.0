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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Search, Users, UserCheck, UserX, DollarSign, Eye, Pencil, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FORM_INITIAL = { nome: '', tipo: 'PROPRIO' as const, especialidade: '', telefone: '', custo_hora: 0 };

export default function Mecanicos() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);
  const [osCount, setOsCount] = useState<Record<string, number>>({});

  useEffect(() => { load(); }, [fromEmpresa]);

  async function load() {
    setIsLoading(true);
    const { data } = await fromEmpresa('mecanicos').order('nome');
    setItems(data || []);
    const { data: exec } = await fromEmpresa('execucoes_os').select('mecanico_id');
    if (exec) {
      const counts: Record<string, number> = {};
      exec.forEach((e: any) => { if (e.mecanico_id) counts[e.mecanico_id] = (counts[e.mecanico_id] || 0) + 1; });
      setOsCount(counts);
    }
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const { error } = await insertWithEmpresa('mecanicos', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Mecânico cadastrado!' }); setDialogOpen(false); setForm(FORM_INITIAL); setSaving(false); load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    const { error } = await supabase.from('mecanicos').update(form).eq('id', selected.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Mecânico atualizado!' }); setDetailOpen(false); setEditMode(false); setSaving(false); load();
  };

  const handleToggleAtivo = async (item: any) => {
    const { error } = await supabase.from('mecanicos').update({ ativo: !item.ativo }).eq('id', item.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: item.ativo ? 'Mecânico desativado' : 'Mecânico ativado' }); load();
  };

  const openDetail = (item: any) => {
    setSelected(item);
    setForm({ nome: item.nome, tipo: item.tipo, especialidade: item.especialidade || '', telefone: item.telefone || '', custo_hora: item.custo_hora || 0 });
    setEditMode(false); setDetailOpen(true);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.nome?.toLowerCase().includes(search.toLowerCase()) || i.especialidade?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === 'TODOS' || i.tipo === filterTipo;
    const matchStatus = filterStatus === 'TODOS' || (filterStatus === 'ATIVO' ? i.ativo : !i.ativo);
    return matchSearch && matchTipo && matchStatus;
  });

  const stats = {
    total: items.length,
    ativos: items.filter(i => i.ativo).length,
    proprios: items.filter(i => i.tipo === 'PROPRIO' && i.ativo).length,
    custoMedio: items.filter(i => i.custo_hora).length > 0 ? (items.reduce((s, i) => s + (i.custo_hora || 0), 0) / items.filter(i => i.custo_hora).length) : 0,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const FormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required placeholder="Nome completo" /></div>
      <div className="space-y-2"><Label>Tipo</Label>
        <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v as any }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="PROPRIO">Próprio</SelectItem><SelectItem value="TERCEIRIZADO">Terceirizado</SelectItem></SelectContent>
        </Select></div>
      <div className="space-y-2"><Label>Especialidade</Label><Input value={form.especialidade} onChange={e => setForm(p => ({ ...p, especialidade: e.target.value }))} placeholder="Ex: Mecânica, Elétrica..." /></div>
      <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
      <div className="space-y-2 md:col-span-2"><Label>Custo/Hora (R$)</Label><Input type="number" step="0.01" value={form.custo_hora} onChange={e => setForm(p => ({ ...p, custo_hora: +e.target.value }))} /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Mecânicos</h1><p className="page-subtitle">Gestão de mão de obra de manutenção</p></div>
        <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setForm(FORM_INITIAL); }}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Mecânico</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Cadastrar Mecânico</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4"><FormFields /><Button type="submit" className="btn-industrial w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Cadastrar</Button></form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><UserCheck className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Users className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{stats.proprios}</p><p className="text-xs text-muted-foreground">Próprios</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><DollarSign className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">R$ {stats.custoMedio.toFixed(0)}</p><p className="text-xs text-muted-foreground">Custo/H Médio</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome ou especialidade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterTipo} onValueChange={setFilterTipo}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos Tipos</SelectItem><SelectItem value="PROPRIO">Próprio</SelectItem><SelectItem value="TERCEIRIZADO">Terceirizado</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="ATIVO">Ativos</SelectItem><SelectItem value="INATIVO">Inativos</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} mecânico(s) encontrado(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>Nome</th><th>Tipo</th><th>Especialidade</th><th>Telefone</th><th>Custo/Hora</th><th>Execuções</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => openDetail(e)}>
            <td className="font-medium">{e.nome}</td>
            <td><Badge variant={e.tipo === 'PROPRIO' ? 'default' : 'secondary'}>{e.tipo === 'PROPRIO' ? 'Próprio' : 'Terceirizado'}</Badge></td>
            <td>{e.especialidade || '-'}</td><td>{e.telefone || '-'}</td>
            <td className="font-mono">R$ {(e.custo_hora || 0).toFixed(2)}</td>
            <td>{osCount[e.id] ? <Badge variant="outline" className="font-mono">{osCount[e.id]}</Badge> : <span className="text-muted-foreground">0</span>}</td>
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
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum mecânico encontrado</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={detailOpen} onOpenChange={v => { setDetailOpen(v); if (!v) { setEditMode(false); setSelected(null); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-lg">{selected.nome}</span>
                <Badge variant={selected.ativo ? 'default' : 'secondary'} className="ml-auto">{selected.ativo ? 'Ativo' : 'Inativo'}</Badge>
              </DialogTitle>
            </DialogHeader>
            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-4 mt-4"><FormFields />
                <div className="flex gap-2"><Button type="submit" className="btn-industrial flex-1" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar</Button><Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button></div>
              </form>
            ) : (
              <Tabs defaultValue="dados" className="mt-4">
                <TabsList className="w-full"><TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger><TabsTrigger value="info" className="flex-1">Informações</TabsTrigger></TabsList>
                <TabsContent value="dados" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="Tipo" value={selected.tipo === 'PROPRIO' ? 'Próprio' : 'Terceirizado'} badge />
                    <InfoField label="Especialidade" value={selected.especialidade || '-'} />
                    <InfoField label="Telefone" value={selected.telefone || '-'} />
                    <InfoField label="Custo/Hora" value={`R$ ${(selected.custo_hora || 0).toFixed(2)}`} mono />
                    <InfoField label="Execuções" value={String(osCount[selected.id] || 0)} mono />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => setEditMode(true)} className="btn-industrial gap-2"><Pencil className="h-4 w-4" />Editar</Button>
                    <Button variant="outline" onClick={() => handleToggleAtivo(selected)}>{selected.ativo ? 'Desativar' : 'Ativar'}</Button>
                  </div>
                </TabsContent>
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField label="ID" value={selected.id} mono />
                    <InfoField label="Cadastro" value={new Date(selected.created_at).toLocaleString('pt-BR')} />
                    <InfoField label="Atualização" value={new Date(selected.updated_at).toLocaleString('pt-BR')} />
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

function InfoField({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      {badge ? <Badge variant="outline">{value}</Badge> : <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>}
    </div>
  );
}
