import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, ClipboardList, AlertTriangle, Clock, Wrench } from 'lucide-react';

const statusLabel: Record<string, string> = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em Andamento', AGUARDANDO_MATERIAL: 'Ag. Material', AGUARDANDO_APROVACAO: 'Ag. Aprovação' };

export default function Backlog() {
  const { fromEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPrio, setFilterPrio] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('ordens_servico').neq('status', 'FECHADA').order('prioridade'); setItems(data || []); setIsLoading(false); }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.equipamento?.toLowerCase().includes(search.toLowerCase()) || i.problema?.toLowerCase().includes(search.toLowerCase());
    const matchPrio = filterPrio === 'TODOS' || i.prioridade === filterPrio;
    const matchStatus = filterStatus === 'TODOS' || i.status === filterStatus;
    return matchSearch && matchPrio && matchStatus;
  });

  const prioColor = (p: string) => p === 'URGENTE' ? 'destructive' : p === 'ALTA' ? 'destructive' : p === 'MEDIA' ? 'secondary' : 'outline';
  const stats = {
    total: items.length,
    urgentes: items.filter(i => i.prioridade === 'URGENTE' || i.prioridade === 'ALTA').length,
    emAndamento: items.filter(i => i.status === 'EM_ANDAMENTO').length,
    aguardando: items.filter(i => i.status === 'AGUARDANDO_MATERIAL' || i.status === 'AGUARDANDO_APROVACAO').length,
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Backlog de Manutenção</h1><p className="page-subtitle">Ordens de serviço pendentes de execução</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ClipboardList className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Pendentes</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.urgentes}</p><p className="text-xs text-muted-foreground">Urgente/Alta</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Wrench className="h-5 w-5 text-blue-500" /></div><div><p className="text-2xl font-bold">{stats.emAndamento}</p><p className="text-xs text-muted-foreground">Em Andamento</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><p className="text-2xl font-bold">{stats.aguardando}</p><p className="text-xs text-muted-foreground">Aguardando</p></div></CardContent></Card>
      </div>

      <Card className="card-industrial"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por TAG, equipamento ou problema..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={filterPrio} onValueChange={setFilterPrio}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Prioridade" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todas</SelectItem><SelectItem value="URGENTE">Urgente</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="ABERTA">Aberta</SelectItem><SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem><SelectItem value="AGUARDANDO_MATERIAL">Ag. Material</SelectItem><SelectItem value="AGUARDANDO_APROVACAO">Ag. Aprovação</SelectItem></SelectContent></Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} OS encontrada(s)</p>
      </CardContent></Card>

      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial w-full"><thead><tr><th>OS</th><th>TAG</th><th>Equipamento</th><th>Tipo</th><th>Problema</th><th>Prioridade</th><th>Status</th><th>Solicitante</th><th>Data</th></tr></thead><tbody>
        {filtered.map(e => (
          <tr key={e.id} className="cursor-pointer" onClick={() => setSelected(e)}>
            <td className="font-mono font-bold text-primary">#{e.numero_os}</td><td className="font-mono">{e.tag}</td><td>{e.equipamento}</td>
            <td><Badge variant="outline">{e.tipo}</Badge></td><td className="max-w-[200px] truncate">{e.problema}</td>
            <td><Badge variant={prioColor(e.prioridade) as any}>{e.prioridade}</Badge></td>
            <td><Badge variant="outline">{statusLabel[e.status] || e.status}</Badge></td>
            <td>{e.solicitante}</td><td>{new Date(e.data_solicitacao).toLocaleDateString('pt-BR')}</td>
          </tr>))}
        {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Nenhuma OS pendente no backlog</td></tr>}
      </tbody></table></div></CardContent></Card>

      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-2xl">
          {selected && (<>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><span className="font-mono text-primary text-xl">#{selected.numero_os}</span><span>{selected.equipamento}</span><Badge variant={prioColor(selected.prioridade) as any} className="ml-auto">{selected.prioridade}</Badge></DialogTitle></DialogHeader>
            <Tabs defaultValue="detalhes" className="mt-4">
              <TabsList className="w-full"><TabsTrigger value="detalhes" className="flex-1">Detalhes</TabsTrigger><TabsTrigger value="tecnico" className="flex-1">Técnico</TabsTrigger></TabsList>
              <TabsContent value="detalhes" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">TAG</p><p className="text-sm font-mono font-bold">{selected.tag}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Tipo</p><Badge variant="outline">{selected.tipo}</Badge></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Solicitante</p><p className="text-sm font-medium">{selected.solicitante}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p><Badge variant="outline">{statusLabel[selected.status] || selected.status}</Badge></div>
                  <div className="space-y-1 col-span-2"><p className="text-xs text-muted-foreground uppercase tracking-wider">Problema</p><p className="text-sm">{selected.problema}</p></div>
                </div>
              </TabsContent>
              <TabsContent value="tecnico" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Tempo Estimado</p><p className="text-sm font-mono">{selected.tempo_estimado ? `${selected.tempo_estimado} min` : '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Custo Estimado</p><p className="text-sm font-mono">{selected.custo_estimado ? `R$ ${selected.custo_estimado.toLocaleString('pt-BR')}` : '-'}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Data Solicitação</p><p className="text-sm">{new Date(selected.data_solicitacao).toLocaleString('pt-BR')}</p></div>
                  <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wider">Aberto por</p><p className="text-sm">{selected.usuario_abertura}</p></div>
                </div>
              </TabsContent>
            </Tabs>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
