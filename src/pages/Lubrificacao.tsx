import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Lubrificacao() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tag: '', equipamento: '', ponto: '', lubrificante: '', quantidade: '', periodicidade: 'MENSAL' as const, responsavel: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('lubrificacao').order('proxima_execucao'); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('lubrificacao', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Plano de lubrificação cadastrado!' }); setDialogOpen(false);
    setForm({ tag: '', equipamento: '', ponto: '', lubrificante: '', quantidade: '', periodicidade: 'MENSAL', responsavel: '' }); load();
  };

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.equipamento?.toLowerCase().includes(search.toLowerCase()));
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Lubrificação</h1><p className="page-subtitle">{filtered.length} planos cadastrados</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Plano</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo Plano de Lubrificação</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} onChange={e => setForm(p => ({...p, equipamento: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Ponto</Label><Input value={form.ponto} onChange={e => setForm(p => ({...p, ponto: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Lubrificante</Label><Input value={form.lubrificante} onChange={e => setForm(p => ({...p, lubrificante: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Quantidade</Label><Input value={form.quantidade} onChange={e => setForm(p => ({...p, quantidade: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Periodicidade</Label><Select value={form.periodicidade} onValueChange={v => setForm(p => ({...p, periodicidade: v as any}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DIARIA">Diária</SelectItem><SelectItem value="SEMANAL">Semanal</SelectItem><SelectItem value="QUINZENAL">Quinzenal</SelectItem><SelectItem value="MENSAL">Mensal</SelectItem><SelectItem value="TRIMESTRAL">Trimestral</SelectItem><SelectItem value="SEMESTRAL">Semestral</SelectItem><SelectItem value="ANUAL">Anual</SelectItem></SelectContent></Select></div>
              <div className="space-y-2 col-span-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({...p, responsavel: e.target.value}))} /></div>
            </div>
            <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Equipamento</th><th>Ponto</th><th>Lubrificante</th><th>Periodicidade</th><th>Próxima</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.equipamento}</td><td>{e.ponto}</td><td>{e.lubrificante}</td><td>{e.periodicidade}</td><td>{new Date(e.proxima_execucao).toLocaleDateString('pt-BR')}</td><td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum plano</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
