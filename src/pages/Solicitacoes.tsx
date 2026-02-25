import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Solicitacoes() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tag: '', equipamento: '', descricao: '', solicitante: '', prioridade: 'MEDIA' as const });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('solicitacoes').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('solicitacoes', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Solicitação registrada!' }); setDialogOpen(false);
    setForm({ tag: '', equipamento: '', descricao: '', solicitante: '', prioridade: 'MEDIA' }); load();
  };

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.descricao?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => s === 'PENDENTE' ? 'secondary' : s === 'APROVADA' ? 'default' : 'outline';
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Solicitações de Serviço</h1><p className="page-subtitle">{filtered.length} solicitações</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Solicitação</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nova Solicitação</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} onChange={e => setForm(p => ({...p, equipamento: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Solicitante</Label><Input value={form.solicitante} onChange={e => setForm(p => ({...p, solicitante: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Prioridade</Label><Select value={form.prioridade} onValueChange={v => setForm(p => ({...p, prioridade: v as any}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="URGENTE">Urgente</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} required /></div>
            <Button type="submit" className="btn-industrial w-full">Registrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Equipamento</th><th>Descrição</th><th>Solicitante</th><th>Prioridade</th><th>Status</th><th>Data</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.equipamento}</td><td className="max-w-[200px] truncate">{e.descricao}</td><td>{e.solicitante}</td><td><Badge variant={e.prioridade === 'URGENTE' ? 'destructive' : 'secondary'}>{e.prioridade}</Badge></td><td><Badge variant={statusColor(e.status) as any}>{e.status}</Badge></td><td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma solicitação</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
