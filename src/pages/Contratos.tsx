import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Contratos() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ numero: '', fornecedor_nome: '', descricao: '', valor: 0, data_inicio: '', data_fim: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('contratos').select('*').order('created_at', { ascending: false });
    setItems(data || []);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('contratos').insert(form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Contrato cadastrado!' });
    setDialogOpen(false);
    setForm({ numero: '', fornecedor_nome: '', descricao: '', valor: 0, data_inicio: '', data_fim: '' });
    load();
  };

  const filtered = items.filter(i => !search || i.numero?.toLowerCase().includes(search.toLowerCase()) || i.fornecedor_nome?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Contratos</h1><p className="page-subtitle">{filtered.length} contratos</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Contrato</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={e => setForm(p => ({...p, numero: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Fornecedor</Label><Input value={form.fornecedor_nome} onChange={e => setForm(p => ({...p, fornecedor_nome: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({...p, valor: +e.target.value}))} /></div>
                <div className="space-y-2"><Label>Início</Label><Input type="date" value={form.data_inicio} onChange={e => setForm(p => ({...p, data_inicio: e.target.value}))} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="date" value={form.data_fim} onChange={e => setForm(p => ({...p, data_fim: e.target.value}))} /></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} /></div>
              <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Número</th><th>Fornecedor</th><th>Valor</th><th>Início</th><th>Fim</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.numero}</td><td>{e.fornecedor_nome}</td><td>R$ {(e.valor || 0).toLocaleString('pt-BR')}</td><td>{e.data_inicio ? new Date(e.data_inicio).toLocaleDateString('pt-BR') : '-'}</td><td>{e.data_fim ? new Date(e.data_fim).toLocaleDateString('pt-BR') : '-'}</td><td><Badge variant={e.status === 'ATIVO' ? 'default' : 'secondary'}>{e.status}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum contrato</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
