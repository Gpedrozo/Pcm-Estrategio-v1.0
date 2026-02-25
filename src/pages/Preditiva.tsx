import { useState, useEffect } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Preditiva() {
  const { fromEmpresa } = useEmpresaQuery();
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [os, setOs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fromEmpresa('equipamentos').eq('ativo', true).order('tag'),
      fromEmpresa('ordens_servico').eq('tipo', 'PREDITIVA').order('created_at', { ascending: false }).limit(20),
    ]).then(([e, o]) => { setEquipamentos(e.data || []); setOs(o.data || []); setIsLoading(false); });
  }, [fromEmpresa]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const criticos = equipamentos.filter(e => e.criticidade === 'A');

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Manutenção Preditiva</h1><p className="page-subtitle">Monitoramento e análises preditivas</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><Activity className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{equipamentos.length}</p><p className="text-sm text-muted-foreground">Equipamentos monitorados</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><AlertTriangle className="h-10 w-10 text-destructive" /><div><p className="text-3xl font-bold">{criticos.length}</p><p className="text-sm text-muted-foreground">Ativos críticos (A)</p></div></CardContent></Card>
        <Card className="card-industrial"><CardContent className="p-6 flex items-center gap-4"><TrendingUp className="h-10 w-10 text-primary" /><div><p className="text-3xl font-bold">{os.length}</p><p className="text-sm text-muted-foreground">OS Preditivas</p></div></CardContent></Card>
      </div>
      <Card className="card-industrial"><CardHeader><CardTitle>Ativos Críticos para Monitoramento</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>TAG</th><th>Nome</th><th>Criticidade</th><th>Risco</th><th>Localização</th><th>Fabricante</th></tr></thead><tbody>
        {criticos.map(e => (<tr key={e.id}><td className="font-mono font-medium">{e.tag}</td><td>{e.nome}</td><td><Badge variant="destructive">{e.criticidade}</Badge></td><td>{e.nivel_risco}</td><td>{e.localizacao || '-'}</td><td>{e.fabricante || '-'}</td></tr>))}
        {criticos.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum ativo crítico</td></tr>}
      </tbody></table></div></CardContent></Card>
      {os.length > 0 && (
        <Card className="card-industrial"><CardHeader><CardTitle>Últimas OS Preditivas</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>OS</th><th>TAG</th><th>Equipamento</th><th>Problema</th><th>Status</th><th>Data</th></tr></thead><tbody>
          {os.map(e => (<tr key={e.id}><td className="font-mono font-medium">#{e.numero_os}</td><td className="font-mono">{e.tag}</td><td>{e.equipamento}</td><td className="max-w-[200px] truncate">{e.problema}</td><td><Badge variant="outline">{e.status}</Badge></td><td>{new Date(e.data_solicitacao).toLocaleDateString('pt-BR')}</td></tr>))}
        </tbody></table></div></CardContent></Card>
      )}
    </div>
  );
}
