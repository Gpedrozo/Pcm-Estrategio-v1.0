import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FMEAPage() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tag: '', componente: '', modo_falha: '', efeito_falha: '', causa_potencial: '', severidade: 5, ocorrencia: 5, deteccao: 5, acao_recomendada: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('fmea').order('rpn', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rpn = form.severidade * form.ocorrencia * form.deteccao;
    const { error } = await insertWithEmpresa('fmea', { ...form, rpn });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'FMEA cadastrada!' }); setDialogOpen(false);
    setForm({ tag: '', componente: '', modo_falha: '', efeito_falha: '', causa_potencial: '', severidade: 5, ocorrencia: 5, deteccao: 5, acao_recomendada: '' }); load();
  };

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.componente?.toLowerCase().includes(search.toLowerCase()));
  const rpnColor = (rpn: number) => rpn >= 200 ? 'destructive' : rpn >= 100 ? 'secondary' : 'default';
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">FMEA / RCM</h1><p className="page-subtitle">{filtered.length} análises cadastradas</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova FMEA</Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Nova Análise FMEA</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Componente</Label><Input value={form.componente} onChange={e => setForm(p => ({...p, componente: e.target.value}))} required /></div>
            </div>
            <div className="space-y-2"><Label>Modo de Falha</Label><Input value={form.modo_falha} onChange={e => setForm(p => ({...p, modo_falha: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>Efeito da Falha</Label><Textarea value={form.efeito_falha} onChange={e => setForm(p => ({...p, efeito_falha: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>Causa Potencial</Label><Input value={form.causa_potencial} onChange={e => setForm(p => ({...p, causa_potencial: e.target.value}))} required /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Severidade (1-10)</Label><Input type="number" min={1} max={10} value={form.severidade} onChange={e => setForm(p => ({...p, severidade: +e.target.value}))} /></div>
              <div className="space-y-2"><Label>Ocorrência (1-10)</Label><Input type="number" min={1} max={10} value={form.ocorrencia} onChange={e => setForm(p => ({...p, ocorrencia: +e.target.value}))} /></div>
              <div className="space-y-2"><Label>Detecção (1-10)</Label><Input type="number" min={1} max={10} value={form.deteccao} onChange={e => setForm(p => ({...p, deteccao: +e.target.value}))} /></div>
            </div>
            <div className="p-3 bg-muted rounded-md text-center"><span className="text-sm text-muted-foreground">RPN = </span><span className="text-xl font-bold">{form.severidade * form.ocorrencia * form.deteccao}</span></div>
            <div className="space-y-2"><Label>Ação Recomendada</Label><Textarea value={form.acao_recomendada} onChange={e => setForm(p => ({...p, acao_recomendada: e.target.value}))} /></div>
            <Button type="submit" className="btn-industrial w-full">Cadastrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Componente</th><th>Modo de Falha</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Status</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.componente}</td><td className="max-w-[200px] truncate">{e.modo_falha}</td><td>{e.severidade}</td><td>{e.ocorrencia}</td><td>{e.deteccao}</td><td><Badge variant={rpnColor(e.rpn) as any}>{e.rpn}</Badge></td><td><Badge variant="outline">{e.status}</Badge></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma análise</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
