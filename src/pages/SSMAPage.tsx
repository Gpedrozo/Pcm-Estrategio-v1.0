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

export default function SSMAPage() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tipo: 'INCIDENTE', descricao: '', local: '', gravidade: 'BAIXA', acao_tomada: '', responsavel: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('ssma_registros').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('ssma_registros', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Registro SSMA cadastrado!' }); setDialogOpen(false);
    setForm({ tipo: 'INCIDENTE', descricao: '', local: '', gravidade: 'BAIXA', acao_tomada: '', responsavel: '' }); load();
  };

  const filtered = items.filter(i => !search || i.descricao?.toLowerCase().includes(search.toLowerCase()) || i.local?.toLowerCase().includes(search.toLowerCase()));
  const gravColor = (g: string) => g === 'CRITICA' || g === 'ALTA' ? 'destructive' : g === 'MEDIA' ? 'secondary' : 'outline';
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">SSMA</h1><p className="page-subtitle">Segurança, Saúde e Meio Ambiente — {filtered.length} registros</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Novo Registro</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo Registro SSMA</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo</Label><Select value={form.tipo} onValueChange={v => setForm(p => ({...p, tipo: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INCIDENTE">Incidente</SelectItem><SelectItem value="QUASE_ACIDENTE">Quase Acidente</SelectItem><SelectItem value="ACIDENTE">Acidente</SelectItem><SelectItem value="DESVIO">Desvio</SelectItem><SelectItem value="OBSERVACAO">Observação</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Gravidade</Label><Select value={form.gravidade} onValueChange={v => setForm(p => ({...p, gravidade: v}))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CRITICA">Crítica</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Local</Label><Input value={form.local} onChange={e => setForm(p => ({...p, local: e.target.value}))} /></div>
              <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({...p, responsavel: e.target.value}))} /></div>
            </div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({...p, descricao: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>Ação Tomada</Label><Textarea value={form.acao_tomada} onChange={e => setForm(p => ({...p, acao_tomada: e.target.value}))} /></div>
            <Button type="submit" className="btn-industrial w-full">Registrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Tipo</th><th>Descrição</th><th>Local</th><th>Gravidade</th><th>Responsável</th><th>Status</th><th>Data</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td><Badge variant="outline">{e.tipo}</Badge></td><td className="max-w-[200px] truncate">{e.descricao}</td><td>{e.local || '-'}</td><td><Badge variant={gravColor(e.gravidade) as any}>{e.gravidade}</Badge></td><td>{e.responsavel || '-'}</td><td><Badge variant={e.status === 'FECHADO' ? 'default' : 'secondary'}>{e.status}</Badge></td><td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
