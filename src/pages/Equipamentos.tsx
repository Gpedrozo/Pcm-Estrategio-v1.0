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
import type { Database } from '@/integrations/supabase/types';

type Criticidade = Database['public']['Enums']['criticidade_abc'];
type NivelRisco = Database['public']['Enums']['nivel_risco'];

export default function Equipamentos() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tag: '', nome: '', criticidade: 'C' as Criticidade, nivel_risco: 'BAIXO' as NivelRisco, localizacao: '', fabricante: '', modelo: '' });

  useEffect(() => { load(); }, [fromEmpresa]);

  async function load() {
    const { data } = await fromEmpresa('equipamentos').order('tag');
    setItems(data || []);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('equipamentos', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Equipamento cadastrado!' });
    setDialogOpen(false);
    setForm({ tag: '', nome: '', criticidade: 'C', nivel_risco: 'BAIXO', localizacao: '', fabricante: '', modelo: '' });
    load();
  };

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.nome?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Equipamentos</h1><p className="page-subtitle">{filtered.length} equipamentos cadastrados</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Equipamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(p => ({...p, nome: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Criticidade</Label>
                  <Select value={form.criticidade} onValueChange={v => setForm(p => ({...p, criticidade: v as Criticidade}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A">A - Crítico</SelectItem><SelectItem value="B">B - Importante</SelectItem><SelectItem value="C">C - Normal</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Nível Risco</Label>
                  <Select value={form.nivel_risco} onValueChange={v => setForm(p => ({...p, nivel_risco: v as NivelRisco}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CRITICO">Crítico</SelectItem><SelectItem value="ALTO">Alto</SelectItem><SelectItem value="MEDIO">Médio</SelectItem><SelectItem value="BAIXO">Baixo</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Localização</Label><Input value={form.localizacao} onChange={e => setForm(p => ({...p, localizacao: e.target.value}))} /></div>
                <div className="space-y-2"><Label>Fabricante</Label><Input value={form.fabricante} onChange={e => setForm(p => ({...p, fabricante: e.target.value}))} /></div>
              </div>
              <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Nome</th><th>Criticidade</th><th>Risco</th><th>Localização</th><th>Fabricante</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.nome}</td><td><Badge variant={e.criticidade === 'A' ? 'destructive' : 'secondary'}>{e.criticidade}</Badge></td><td>{e.nivel_risco}</td><td>{e.localizacao || '-'}</td><td>{e.fabricante || '-'}</td><td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum equipamento</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
