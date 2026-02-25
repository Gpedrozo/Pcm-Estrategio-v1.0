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
import { Loader2, Plus, Search, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Inspecoes() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ tag: '', equipamento: '', tipo_inspecao: 'VISUAL', responsavel: '', observacoes: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() {
    setIsLoading(true);
    const [ins, eq] = await Promise.all([fromEmpresa('inspecoes').order('data_inspecao', { ascending: false }), fromEmpresa('equipamentos').eq('ativo', true).order('tag')]);
    setItems(ins.data || []); setEquipamentos(eq.data || []); setIsLoading(false);
  }

  const handleTagChange = (tag: string) => { const eq = equipamentos.find(e => e.tag === tag); setForm(p => ({ ...p, tag, equipamento: eq?.nome || '' })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('inspecoes', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Inspeção registrada!' }); setDialogOpen(false);
    setForm({ tag: '', equipamento: '', tipo_inspecao: 'VISUAL', responsavel: '', observacoes: '' }); load();
  };

  const handleUpdateStatus = async (item: any, status: string) => {
    const { error } = await supabase.from('inspecoes').update({ status }).eq('id', item.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Status atualizado para ${status}` }); setSelected(null); load();
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.equipamento?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'TODOS' || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor = (s: string) => s === 'CONFORME' ? 'default' : s === 'NAO_CONFORME' ? 'destructive' : 'secondary';
  const stats = {
    total: items.length,
    pendentes: items.filter(i => i.status === 'PENDENTE').length,
    conformes: items.filter(i => i.status === 'CONFORME').length,
    naoConformes: items.filter(i => i.status === 'NAO_CONFORME').length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Inspeções</h1><p className="page-subtitle">Registro e controle de inspeções técnicas</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Inspeção</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Nova Inspeção</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>TAG</Label><Select value={form.tag} onValueChange={handleTagChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{equipamentos.map(eq => <SelectItem key={eq.id} value={eq.tag}>{eq.tag} - {eq.nome}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} readOnly className="bg-muted" /></div>
                <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo_inspecao} onValueChange={v => setForm(p => ({ ...p, tipo_inspecao: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VISUAL">Visual</SelectItem><SelectItem value="TERMOGRAFICA">Termográfica</SelectItem><SelectItem value="VIBRACAO">Vibração</SelectItem><SelectItem value="ULTRASSOM">Ultrassom</SelectItem><SelectItem value="ELETRICA">Elétrica</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
              <Button type="submit" className="btn-industrial w-full">Registrar</Button>
            </form>
          </DialogContent></Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ClipboardCheck className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div><div><p className="text-2xl font-bold">{stats.conformes}</p><p className="text-xs text-muted-foreground">Conformes</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.naoConformes}</p><p className="text-xs text-muted-foreground">Não Conformes</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por TAG ou equipamento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="CONFORME">Conforme</SelectItem><SelectItem value="NAO_CONFORME">Não Conforme</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} inspeção(ões)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>TAG</th><th>Equipamento</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Status</th><th>Resultado</th><th className="text-right">Ações</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
            <td className="font-mono font-bold text-primary">{e.tag}</td><td>{e.equipamento}</td>
            <td><Badge variant="outline">{e.tipo_inspecao}</Badge></td>
            <td>{e.responsavel || '-'}</td><td>{new Date(e.data_inspecao).toLocaleDateString('pt-BR')}</td>
            <td><Badge variant={statusColor(e.status) as any}>{e.status}</Badge></td><td>{e.resultado || '-'}</td>
            <td className="text-right" onClick={ev => ev.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(e)}><Eye className="h-4 w-4" /></Button></td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhuma inspeção</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary">{selected.tag}</span><span>{selected.equipamento}</span><Badge variant={statusColor(selected.status) as any} className="ml-auto">{selected.status}</Badge></DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p><Badge variant="outline">{selected.tipo_inspecao}</Badge></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Responsável</p><p className="text-sm">{selected.responsavel || '-'}</p></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Data</p><p className="text-sm">{new Date(selected.data_inspecao).toLocaleString('pt-BR')}</p></div>
                <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Resultado</p><p className="text-sm">{selected.resultado || '-'}</p></div>
                <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Observações</p><p className="text-sm">{selected.observacoes || '-'}</p></div>
              </div>
              {selected.status === 'PENDENTE' && (
                <div className="flex gap-2">
                  <Button onClick={() => handleUpdateStatus(selected, 'CONFORME')} className="btn-industrial gap-2"><CheckCircle2 className="h-4 w-4" />Conforme</Button>
                  <Button variant="destructive" onClick={() => handleUpdateStatus(selected, 'NAO_CONFORME')} className="gap-2"><AlertTriangle className="h-4 w-4" />Não Conforme</Button>
                </div>
              )}
            </div>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
