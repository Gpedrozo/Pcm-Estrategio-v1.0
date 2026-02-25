import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export default function DocumentosTecnicos() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ codigo: '', titulo: '', tipo: 'POP', descricao: '', versao: '1.0', responsavel: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('codigo');
    setItems(data || []);
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('documentos_tecnicos').insert(form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Documento cadastrado!' });
    setDialogOpen(false);
    setForm({ codigo: '', titulo: '', tipo: 'POP', descricao: '', versao: '1.0', responsavel: '' });
    load();
  };

  const filtered = items.filter(i => !search || i.codigo?.toLowerCase().includes(search.toLowerCase()) || i.titulo?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Documentos Técnicos</h1><p className="page-subtitle">{filtered.length} documentos</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Documento</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Novo Documento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Código</Label><Input value={form.codigo} onChange={e => setForm(p => ({...p, codigo: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(p => ({...p, titulo: e.target.value}))} required /></div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({...p, tipo: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="POP">POP</SelectItem><SelectItem value="MANUAL">Manual</SelectItem><SelectItem value="PROCEDIMENTO">Procedimento</SelectItem><SelectItem value="INSTRUCAO">Instrução de Trabalho</SelectItem><SelectItem value="CHECKLIST">Checklist</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Versão</Label><Input value={form.versao} onChange={e => setForm(p => ({...p, versao: e.target.value}))} /></div>
                <div className="space-y-2 col-span-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({...p, responsavel: e.target.value}))} /></div>
              </div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} /></div>
              <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Código</th><th>Título</th><th>Tipo</th><th>Versão</th><th>Responsável</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.codigo}</td><td>{e.titulo}</td><td><Badge variant="outline">{e.tipo}</Badge></td><td>{e.versao}</td><td>{e.responsavel || '-'}</td><td><Badge variant={e.status === 'VIGENTE' ? 'default' : 'secondary'}>{e.status}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum documento</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
