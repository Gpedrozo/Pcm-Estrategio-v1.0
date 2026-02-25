import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

export default function Auditoria() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('auditoria').select('*').order('created_at', { ascending: false }).limit(200);
    setItems(data || []);
    setIsLoading(false);
  }

  const filtered = items.filter(i => !search || i.acao?.toLowerCase().includes(search.toLowerCase()) || i.usuario_nome?.toLowerCase().includes(search.toLowerCase()) || i.descricao?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Auditoria</h1><p className="page-subtitle">Log de ações realizadas — {filtered.length} registros</p></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por ação, usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-md" /></div>
      <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Descrição</th><th>TAG</th></tr></thead><tbody>
        {filtered.map(e => (<tr key={e.id}><td className="font-mono text-sm whitespace-nowrap">{new Date(e.created_at).toLocaleString('pt-BR')}</td><td>{e.usuario_nome}</td><td><Badge variant="outline">{e.acao}</Badge></td><td className="max-w-[300px] truncate">{e.descricao}</td><td className="font-mono">{e.tag || '-'}</td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro de auditoria</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
