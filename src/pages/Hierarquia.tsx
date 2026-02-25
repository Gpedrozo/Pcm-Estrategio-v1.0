import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Building2 } from 'lucide-react';

export default function Hierarquia() {
  const { fromEmpresa } = useEmpresaQuery();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, [fromEmpresa]);
  async function load() { const { data } = await fromEmpresa('equipamentos').order('tag'); setItems(data || []); setIsLoading(false); }

  const filtered = items.filter(i => !search || i.tag?.toLowerCase().includes(search.toLowerCase()) || i.localizacao?.toLowerCase().includes(search.toLowerCase()));
  const grouped: Record<string, any[]> = filtered.reduce((acc: Record<string, any[]>, item) => { const loc = item.localizacao || 'Sem localização'; if (!acc[loc]) acc[loc] = []; acc[loc].push(item); return acc; }, {});
  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Hierarquia de Ativos</h1><p className="page-subtitle">{filtered.length} equipamentos em {Object.keys(grouped).length} localizações</p></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por TAG ou localização..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      {Object.entries(grouped).map(([loc, eqs]) => (
        <Card key={loc} className="card-industrial"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{loc}<Badge variant="outline" className="ml-2">{eqs.length}</Badge></CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Nome</th><th>Criticidade</th><th>Risco</th><th>Fabricante</th><th>Status</th></tr></thead><tbody>
          {eqs.map((e: any) => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.nome}</td><td><Badge variant={e.criticidade === 'A' ? 'destructive' : 'secondary'}>{e.criticidade}</Badge></td><td>{e.nivel_risco}</td><td>{e.fabricante || '-'}</td><td><Badge variant={e.ativo ? 'default' : 'secondary'}>{e.ativo ? 'Ativo' : 'Inativo'}</Badge></td></tr>))}
        </tbody></table></div></CardContent></Card>
      ))}
      {Object.keys(grouped).length === 0 && <Card className="card-industrial"><CardContent className="p-8 text-center text-muted-foreground">Nenhum equipamento cadastrado</CardContent></Card>}
    </div>
  );
}
