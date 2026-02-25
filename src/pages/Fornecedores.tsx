import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Fornecedores() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', especialidade: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome');
    setItems(data || []);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('fornecedores').insert(form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Fornecedor cadastrado!' });
    setDialogOpen(false);
    setForm({ nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', especialidade: '' });
    load();
  };

  const filtered = items.filter(i => !search || i.nome?.toLowerCase().includes(search.toLowerCase()) || i.cnpj?.includes(search));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Fornecedores</h1><p className="page-subtitle">{filtered.length} fornecedores cadastrados</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(p => ({...p, cnpj: e.target.value}))} /></div>
                <div className="space-y-2"><Label>Contato</Label><Input value={form.contato} onChange={e => setForm(p => ({...p, contato: e.target.value}))} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(p => ({...p, telefone: e.target.value}))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></div>
                <div className="space-y-2"><Label>Especialidade</Label><Input value={form.especialidade} onChange={e => setForm(p => ({...p, especialidade: e.target.value}))} /></div>
                <div className="space-y-2 col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm(p => ({...p, endereco: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Nome</th><th>CNPJ</th><th>Contato</th><th>Telefone</th><th>Email</th><th>Especialidade</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-medium">{e.nome}</td><td className="font-mono">{e.cnpj || '-'}</td><td>{e.contato || '-'}</td><td>{e.telefone || '-'}</td><td>{e.email || '-'}</td><td>{e.especialidade || '-'}</td><td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
