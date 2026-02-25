import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';

export default function HistoricoOS() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ordens_servico')
        .select('*')
        .order('created_at', { ascending: false });
      setOrdens(data || []);
      setIsLoading(false);
    }
    load();
  }, []);

  const filtered = ordens.filter(os => {
    const matchSearch = !searchTerm || os.tag?.toLowerCase().includes(searchTerm.toLowerCase()) || os.equipamento?.toLowerCase().includes(searchTerm.toLowerCase()) || String(os.numero_os).includes(searchTerm);
    const matchStatus = filterStatus === 'TODOS' || os.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ABERTA: 'status-aberta', EM_ANDAMENTO: 'status-andamento',
      FECHADA: 'status-fechada', AGUARDANDO_MATERIAL: 'status-aguardando', AGUARDANDO_APROVACAO: 'status-aguardando',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || ''}`}>{status.replace(/_/g, ' ')}</span>;
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Histórico de O.S</h1>
        <p className="page-subtitle">{filtered.length} ordens encontradas</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por Nº, TAG ou equipamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="ABERTA">Aberta</SelectItem>
            <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
            <SelectItem value="AGUARDANDO_MATERIAL">Aguardando Material</SelectItem>
            <SelectItem value="FECHADA">Fechada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="card-industrial">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="table-industrial">
              <thead>
                <tr>
                  <th>Nº</th><th>Tipo</th><th>TAG</th><th>Equipamento</th><th>Prioridade</th><th>Status</th><th>Solicitante</th><th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((os) => (
                  <tr key={os.id}>
                    <td className="font-mono font-medium">{os.numero_os}</td>
                    <td><Badge variant="outline">{os.tipo}</Badge></td>
                    <td className="font-mono">{os.tag}</td>
                    <td>{os.equipamento}</td>
                    <td><Badge variant={os.prioridade === 'URGENTE' ? 'destructive' : 'secondary'}>{os.prioridade}</Badge></td>
                    <td>{statusBadge(os.status)}</td>
                    <td>{os.solicitante}</td>
                    <td className="text-muted-foreground">{new Date(os.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma O.S encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
