import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarClock } from 'lucide-react';

export default function Programacao() {
  const { fromEmpresa } = useEmpresaQuery();
  const [planos, setPlanos] = useState<any[]>([]);
  const [lubrificacao, setLubrificacao] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fromEmpresa('planos_preventivos').eq('ativo', true).order('proxima_execucao'),
      fromEmpresa('lubrificacao').eq('ativo', true).order('proxima_execucao'),
    ]).then(([p, l]) => { setPlanos(p.data || []); setLubrificacao(l.data || []); setIsLoading(false); });
  }, [fromEmpresa]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const allItems = [...planos.map(p => ({ ...p, _tipo: 'Preventiva', _nome: p.nome })), ...lubrificacao.map(l => ({ ...l, _tipo: 'Lubrificação', _nome: l.ponto }))].sort((a, b) => new Date(a.proxima_execucao).getTime() - new Date(b.proxima_execucao).getTime());
  const isOverdue = (d: string) => new Date(d) < new Date();

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Programação</h1><p className="page-subtitle">Calendário de manutenção programada — {allItems.length} atividades</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-primary">{planos.length}</p><p className="text-sm text-muted-foreground">Planos Preventivos</p></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-primary">{lubrificacao.length}</p><p className="text-sm text-muted-foreground">Lubrificações</p></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-destructive">{allItems.filter(i => isOverdue(i.proxima_execucao)).length}</p><p className="text-sm text-muted-foreground">Atrasadas</p></CardContent></Card>
      </div>
      <Card className="card-industrial"><CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Próximas Atividades</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Tipo</th><th>TAG</th><th>Equipamento</th><th>Atividade</th><th>Periodicidade</th><th>Próxima Execução</th><th>Status</th></tr></thead><tbody>
        {allItems.map(e => (<tr key={e.id}><td><Badge variant="outline">{e._tipo}</Badge></td><td className="font-mono font-medium">{e.tag}</td><td>{e.equipamento}</td><td>{e._nome}</td><td>{e.periodicidade}</td><td>{new Date(e.proxima_execucao).toLocaleDateString('pt-BR')}</td><td><Badge variant={isOverdue(e.proxima_execucao) ? 'destructive' : 'default'}>{isOverdue(e.proxima_execucao) ? 'Atrasada' : 'No prazo'}</Badge></td></tr>))}
        {allItems.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma atividade programada</td></tr>}
      </tbody></table></div></CardContent></Card>
    </div>
  );
}
