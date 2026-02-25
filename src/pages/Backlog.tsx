import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

export default function Backlog() {
  const { fromEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('ordens_servico').neq('status', 'FECHADA').order('prioridade'); setItems(data || []); setIsLoading(false); }

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.equipamento?.toLowerCase().includes(search.toLowerCase()));
  const prioColor = (p: string) => p === 'URGENTE' || p === 'ALTA' ? 'destructive' : 'secondary';
  const statusLabel: Record<string, string> = { ABERTA: 'Aberta', EM_ANDAMENTO: 'Em Andamento', AGUARDANDO_MATERIAL: 'Ag. Material', AGUARDANDO_APROVACAO: 'Ag. Aprovação' };
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Backlog de Manutenção</h1><p className="page-subtitle">{filtered.length} ordens pendentes</p></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>OS</th><th>TAG</th><th>Equipamento</th><th>Tipo</th><th>Prioridade</th><th>Status</th><th>Solicitante</th><th>Data</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono font-medium">#{e.numero_os}</td><td className="font-mono">{e.tag}</td><td>{e.equipamento}</td><td>{e.tipo}</td><td><Badge variant={prioColor(e.prioridade) as any}>{e.prioridade}</Badge></td><td><Badge variant="outline">{statusLabel[e.status] || e.status}</Badge></td><td>{e.solicitante}</td><td>{new Date(e.data_solicitacao).toLocaleDateString('pt-BR')}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma OS pendente no backlog</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
