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

export default function RCAPage() {
  const { fromEmpresa, insertWithEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ tag: '', equipamento: '', descricao_falha: '', porque_1: '', porque_2: '', porque_3: '', porque_4: '', porque_5: '', causa_raiz_identificada: '', acao_corretiva: '', responsavel: '' });

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('analise_causa_raiz').order('created_at', { ascending: false }); setItems(data || []); setIsLoading(false); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await insertWithEmpresa('analise_causa_raiz', form);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Análise registrada!' }); setDialogOpen(false);
    setForm({ tag: '', equipamento: '', descricao_falha: '', porque_1: '', porque_2: '', porque_3: '', porque_4: '', porque_5: '', causa_raiz_identificada: '', acao_corretiva: '', responsavel: '' }); load();
  };

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.descricao_falha?.toLowerCase().includes(search.toLowerCase()));
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header"><h1 className="page-title">Análise de Causa Raiz</h1><p className="page-subtitle">{filtered.length} análises — Método 5 Porquês</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="btn-industrial gap-2"><Plus className="h-4 w-4" />Nova Análise</Button></DialogTrigger><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Análise de Causa Raiz</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>TAG</Label><Input value={form.tag} onChange={e => setForm(p => ({...p, tag: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Equipamento</Label><Input value={form.equipamento} onChange={e => setForm(p => ({...p, equipamento: e.target.value}))} required /></div>
            </div>
            <div className="space-y-2"><Label>Descrição da Falha</Label><Textarea value={form.descricao_falha} onChange={e => setForm(p => ({...p, descricao_falha: e.target.value}))} required /></div>
            <div className="space-y-2"><Label>1º Por quê?</Label><Input value={form.porque_1} onChange={e => setForm(p => ({...p, porque_1: e.target.value}))} /></div>
            <div className="space-y-2"><Label>2º Por quê?</Label><Input value={form.porque_2} onChange={e => setForm(p => ({...p, porque_2: e.target.value}))} /></div>
            <div className="space-y-2"><Label>3º Por quê?</Label><Input value={form.porque_3} onChange={e => setForm(p => ({...p, porque_3: e.target.value}))} /></div>
            <div className="space-y-2"><Label>4º Por quê?</Label><Input value={form.porque_4} onChange={e => setForm(p => ({...p, porque_4: e.target.value}))} /></div>
            <div className="space-y-2"><Label>5º Por quê?</Label><Input value={form.porque_5} onChange={e => setForm(p => ({...p, porque_5: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Causa Raiz Identificada</Label><Textarea value={form.causa_raiz_identificada} onChange={e => setForm(p => ({...p, causa_raiz_identificada: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Ação Corretiva</Label><Textarea value={form.acao_corretiva} onChange={e => setForm(p => ({...p, acao_corretiva: e.target.value}))} /></div>
            <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({...p, responsavel: e.target.value}))} /></div>
            <Button type="submit" className="btn-industrial w-full">Registrar</Button>
          </form>
        </DialogContent></Dialog>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Equipamento</th><th>Falha</th><th>Causa Raiz</th><th>Responsável</th><th>Status</th><th>Data</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.equipamento}</td><td className="max-w-[200px] truncate">{e.descricao_falha}</td><td className="max-w-[200px] truncate">{e.causa_raiz_identificada || '-'}</td><td>{e.responsavel || '-'}</td><td><Badge variant={e.status === 'CONCLUIDA' ? 'default' : 'secondary'}>{e.status}</Badge></td><td>{new Date(e.created_at).toLocaleDateString('pt-BR')}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma análise</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
