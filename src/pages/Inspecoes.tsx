import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Inspecoes() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tag: '', equipamento: '', tipo_inspecao: 'VISUAL', responsavel: '', observacoes: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('inspecoes').order('data_inspecao', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('inspecoes', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Inspeção registrada!' }); setDialogOpen(false);
    setForm({ tag: '', equipamento: '', tipo_inspecao: 'VISUAL', responsavel: '', observacoes: '' }); load();
  };

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.equipamento?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => s === 'CONFORME' ? 'default' : s === 'NAO_CONFORME' ? 'destructive' : 'secondary';
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Inspeções</h1><p className="page-subtitle">{filtered.length} inspeções registradas</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Inspeção</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nova Inspeção</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} onChange={e => setForm(p => ({...p, equipamento: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo_inspecao} onValueChange={v => setForm(p => ({...p, tipo_inspecao: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VISUAL">Visual</SelectItem><SelectItem value="TERMOGRAFICA">Termográfica</SelectItem><SelectItem value="VIBRACAO">Vibração</SelectItem><SelectItem value="ULTRASSOM">Ultrassom</SelectItem><SelectItem value="ELETRICA">Elétrica</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({...p, responsavel: e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({...p, observacoes: e.target.value}))} /></div>
            <Button type="submit" className="btn-industrial w-full">Registrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Equipamento</th><th>Tipo</th><th>Responsável</th><th>Data</th><th>Status</th><th>Resultado</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.equipamento}</td><td>{e.tipo_inspecao}</td><td>{e.responsavel || '-'}</td><td>{new Date(e.data_inspecao).toLocaleDateString('pt-BR')}</td><td><Badge variant={statusColor(e.status) as any}>{e.status}</Badge></td><td>{e.resultado || '-'}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma inspeção</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
