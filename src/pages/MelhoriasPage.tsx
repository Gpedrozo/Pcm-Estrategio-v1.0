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

export default function MelhoriasPage() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ titulo: '', descricao: '', area: '', tag: '', beneficio_esperado: '', custo_estimado: 0, responsavel: '', prioridade: 'MEDIA' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('melhorias').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('melhorias', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Melhoria registrada!' }); setDialogOpen(false);
    setForm({ titulo: '', descricao: '', area: '', tag: '', beneficio_esperado: '', custo_estimado: 0, responsavel: '', prioridade: 'MEDIA' }); load();
  };

  const filtered = items.filter(i => !search || i.titulo?.toLowerCase().includes(search.toLowerCase()));
  const statusColor = (s: string) => s === 'CONCLUIDA' ? 'default' : s === 'EM_EXECUCAO' ? 'secondary' : 'outline';
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Melhorias</h1><p className="page-subtitle">{filtered.length} projetos de melhoria</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Melhoria</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nova Melhoria</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={form.titulo} onChange={e => setForm(p => ({...p, titulo: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Área</Label><Input value={form.area} onChange={e => setForm(p => ({...p, area: e.target.value}))} /></div>
              <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Prioridade</Label><Select value={form.prioridade} onValueChange={v => setForm(p => ({...p, prioridade: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Custo Estimado (R$)</Label><Input type="number" value={form.custo_estimado} onChange={e => setForm(p => ({...p, custo_estimado: +e.target.value}))} /></div>
              <div className="space-y-2"><Label>Benefício Esperado</Label><Input value={form.beneficio_esperado} onChange={e => setForm(p => ({...p, beneficio_esperado: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({...p, responsavel: e.target.value}))} /></div>
            </div>
            <Button type="submit" className="btn-industrial w-full">Registrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Título</th><th>Área</th><th>Prioridade</th><th>Custo</th><th>Responsável</th><th>Status</th><th>Data</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-medium">{e.titulo}</td><td>{e.area || '-'}</td><td><Badge variant={e.prioridade === 'ALTA' ? 'destructive' : 'secondary'}>{e.prioridade}</Badge></td><td>R$ {(e.custo_estimado || 0).toLocaleString('pt-BR')}</td><td>{e.responsavel || '-'}</td><td><Badge variant={statusColor(e.status) as any}>{e.status}</Badge></td><td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma melhoria</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
