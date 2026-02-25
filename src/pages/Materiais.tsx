import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Materiais() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', nome: '', unidade: 'UN', estoque_atual: 0, estoque_minimo: 0, custo_unitario: 0, localizacao: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('materiais').order('codigo'); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('materiais', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Material cadastrado!' }); setDialogOpen(false);
    setForm({ codigo: '', nome: '', unidade: 'UN', estoque_atual: 0, estoque_minimo: 0, custo_unitario: 0, localizacao: '' }); load();
  };

  const filtered = items.filter(i => !search || i.codigo?.toLowerCase().includes(search.toLowerCase()) || i.nome?.toLowerCase().includes(search.toLowerCase()));
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Materiais e Peças</h1><p className="page-subtitle">{filtered.length} materiais cadastrados</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Material</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Código</Label><Input value={form.codigo} onChange={e => setForm(p => ({...p, codigo: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Unidade</Label><Input value={form.unidade} onChange={e => setForm(p => ({...p, unidade: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Estoque Atual</Label><Input type="number" value={form.estoque_atual} onChange={e => setForm(p => ({...p, estoque_atual: +e.target.value}))} /></div>
              <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.estoque_minimo} onChange={e => setForm(p => ({...p, estoque_minimo: +e.target.value}))} /></div>
              <div className="space-y-2"><Label>Custo Unitário (R$)</Label><Input type="number" step="0.01" value={form.custo_unitario} onChange={e => setForm(p => ({...p, custo_unitario: +e.target.value}))} /></div>
              <div className="space-y-2 col-span-2"><Label>Localização</Label><Input value={form.localizacao} onChange={e => setForm(p => ({...p, localizacao: e.target.value}))} /></div>
            </div>
            <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Código</th><th>Nome</th><th>UN</th><th>Estoque</th><th>Mínimo</th><th>Custo UN</th><th>Localização</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.codigo}</td><td>{e.nome}</td><td>{e.unidade}</td><td><span className={e.estoque_atual <= e.estoque_minimo ? 'text-destructive font-bold' : ''}>{e.estoque_atual}</span></td><td>{e.estoque_minimo}</td><td>R$ {(e.custo_unitario || 0).toFixed(2)}</td><td>{e.localizacao || '-'}</td><td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum material</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
