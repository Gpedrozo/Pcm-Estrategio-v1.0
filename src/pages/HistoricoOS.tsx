import { useState, useEffect, useMemo } from 'react';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Download, Eye, FileText, BarChart3, Filter, X, Printer } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--destructive))'];

export default function HistoricoOS() {
  const { fromEmpresa } = useEmpresaQuery();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [execucao, setExecucao] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('lista');

  const [filters, setFilters] = useState({
    search: '', status: '', tipo: '', prioridade: '', tag: '',
  });

  useEffect(() => {
    Promise.all([
      fromEmpresa('ordens_servico').order('created_at', { ascending: false }),
      fromEmpresa('equipamentos'),
    ]).then(([osRes, eqRes]) => {
      setOrdens(osRes.data || []);
      setEquipamentos(eqRes.data || []);
      setIsLoading(false);
    });
  }, [fromEmpresa]);

  const filtered = useMemo(() => {
    return ordens.filter(os => {
      if (filters.status && os.status !== filters.status) return false;
      if (filters.tipo && os.tipo !== filters.tipo) return false;
      if (filters.prioridade && os.prioridade !== filters.prioridade) return false;
      if (filters.tag && os.tag !== filters.tag) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!String(os.numero_os).includes(filters.search) &&
            !os.tag.toLowerCase().includes(s) &&
            !os.equipamento.toLowerCase().includes(s) &&
            !os.problema.toLowerCase().includes(s) &&
            !os.solicitante.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [ordens, filters]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    filtered.forEach(os => {
      byType[os.tipo] = (byType[os.tipo] || 0) + 1;
      byStatus[os.status] = (byStatus[os.status] || 0) + 1;
    });
    const fechadas = filtered.filter(o => o.status === 'FECHADA').length;
    return {
      total: filtered.length,
      fechadas,
      abertas: filtered.length - fechadas,
      taxaFechamento: ((fechadas / filtered.length) * 100).toFixed(1),
      byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
    };
  }, [filtered]);

  const handleViewOS = async (os: any) => {
    setSelectedOS(os);
    const { data } = await supabase.from('execucoes_os').select('*').eq('os_id', os.id).maybeSingle();
    setExecucao(data);
  };

  const handleExportCSV = () => {
    const headers = ['Nº OS', 'TAG', 'Equipamento', 'Tipo', 'Prioridade', 'Status', 'Data', 'Solicitante', 'Problema'];
    const rows = filtered.map(os => [
      os.numero_os, os.tag, os.equipamento, os.tipo, os.prioridade, os.status,
      new Date(os.data_solicitacao).toLocaleDateString('pt-BR'), os.solicitante, `"${os.problema.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_os_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => setFilters({ search: '', status: '', tipo: '', prioridade: '', tag: '' });
  const hasFilters = Object.values(filters).some(v => v);
  const uniqueTags = [...new Set(equipamentos.map(e => e.tag))].sort();

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { ABERTA: 'status-aberta', EM_ANDAMENTO: 'status-andamento', FECHADA: 'status-fechada', AGUARDANDO_MATERIAL: 'status-aguardando', AGUARDANDO_APROVACAO: 'status-aguardando' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || ''}`}>{status.replace(/_/g, ' ')}</span>;
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header"><h1 className="page-title">Histórico de O.S</h1><p className="page-subtitle">{filtered.length} ordens encontradas</p></div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2"><Download className="h-4 w-4" />Exportar CSV</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lista" className="gap-2"><FileText className="h-4 w-4" />Lista</TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2"><BarChart3 className="h-4 w-4" />Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filters */}
          <Card className="card-industrial">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Filtros</span></div>
                {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1"><X className="h-3 w-3" />Limpar</Button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." value={filters.search} onChange={e => setFilters(p => ({...p, search: e.target.value}))} className="pl-9" /></div>
                <Select value={filters.tag || 'all'} onValueChange={v => setFilters(p => ({...p, tag: v === 'all' ? '' : v}))}><SelectTrigger><SelectValue placeholder="TAG" /></SelectTrigger><SelectContent><SelectItem value="all">Todas TAGs</SelectItem>{uniqueTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                <Select value={filters.tipo || 'all'} onValueChange={v => setFilters(p => ({...p, tipo: v === 'all' ? '' : v}))}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="CORRETIVA">Corretiva</SelectItem><SelectItem value="PREVENTIVA">Preventiva</SelectItem><SelectItem value="PREDITIVA">Preditiva</SelectItem><SelectItem value="INSPECAO">Inspeção</SelectItem><SelectItem value="MELHORIA">Melhoria</SelectItem></SelectContent></Select>
                <Select value={filters.status || 'all'} onValueChange={v => setFilters(p => ({...p, status: v === 'all' ? '' : v}))}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ABERTA">Aberta</SelectItem><SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem><SelectItem value="AGUARDANDO_MATERIAL">Aguardando Mat.</SelectItem><SelectItem value="FECHADA">Fechada</SelectItem></SelectContent></Select>
                <Select value={filters.prioridade || 'all'} onValueChange={v => setFilters(p => ({...p, prioridade: v === 'all' ? '' : v}))}><SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="URGENTE">Urgente</SelectItem><SelectItem value="ALTA">Alta</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="BAIXA">Baixa</SelectItem></SelectContent></Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="card-industrial"><CardContent className="p-0"><div className="overflow-x-auto"><table className="table-industrial"><thead><tr><th>Nº</th><th>Tipo</th><th>TAG</th><th>Equipamento</th><th>Prioridade</th><th>Status</th><th>Solicitante</th><th>Data</th><th></th></tr></thead><tbody>
            {filtered.map(os => (
              <tr key={os.id}>
                <td className="font-mono font-medium">{os.numero_os}</td>
                <td><Badge variant="outline">{os.tipo}</Badge></td>
                <td className="font-mono text-primary">{os.tag}</td>
                <td className="max-w-[150px] truncate">{os.equipamento}</td>
                <td><Badge variant={os.prioridade === 'URGENTE' ? 'destructive' : 'secondary'}>{os.prioridade}</Badge></td>
                <td>{statusBadge(os.status)}</td>
                <td>{os.solicitante}</td>
                <td className="text-muted-foreground">{new Date(os.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                <td><Button variant="ghost" size="icon" onClick={() => handleViewOS(os)}><Eye className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma O.S encontrada</td></tr>}
          </tbody></table></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="estatisticas" className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="card-industrial"><CardContent className="p-4"><p className="text-2xl font-bold font-mono">{stats.total}</p><p className="text-xs text-muted-foreground">Total de OS</p></CardContent></Card>
                <Card className="card-industrial"><CardContent className="p-4"><p className="text-2xl font-bold font-mono text-warning">{stats.abertas}</p><p className="text-xs text-muted-foreground">Em Aberto</p></CardContent></Card>
                <Card className="card-industrial"><CardContent className="p-4"><p className="text-2xl font-bold font-mono text-success">{stats.fechadas}</p><p className="text-xs text-muted-foreground">Fechadas</p></CardContent></Card>
                <Card className="card-industrial"><CardContent className="p-4"><p className="text-2xl font-bold font-mono">{stats.taxaFechamento}%</p><p className="text-xs text-muted-foreground">Taxa de Fechamento</p></CardContent></Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Por Tipo</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={stats.byType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, value}) => `${name} (${value})`}>{stats.byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
                </CardContent></Card>
                <Card className="card-industrial"><CardHeader><CardTitle className="text-sm">Por Status</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={250}><BarChart data={stats.byStatus}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
                </CardContent></Card>
              </div>
            </>
          ) : <p className="text-center text-muted-foreground py-12">Sem dados para exibir estatísticas</p>}
        </TabsContent>
      </Tabs>

      {/* OS Details Modal */}
      <Dialog open={!!selectedOS} onOpenChange={(open) => !open && setSelectedOS(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOS && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-xl">O.S {selectedOS.numero_os}</span>
                  {statusBadge(selectedOS.status)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                  <div><Label className="text-xs text-muted-foreground">TAG</Label><p className="font-mono text-primary font-medium">{selectedOS.tag}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Equipamento</Label><p>{selectedOS.equipamento}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Tipo</Label><p><Badge variant="outline">{selectedOS.tipo}</Badge></p></div>
                  <div><Label className="text-xs text-muted-foreground">Prioridade</Label><p>{selectedOS.prioridade}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Solicitante</Label><p>{selectedOS.solicitante}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Data</Label><p>{new Date(selectedOS.data_solicitacao).toLocaleDateString('pt-BR')}</p></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Problema</Label><p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">{selectedOS.problema}</p></div>

                {selectedOS.status === 'FECHADA' && (selectedOS.modo_falha || selectedOS.causa_raiz) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-sm">Análise de Causa Raiz</h4>
                    <div className="space-y-2 p-3 bg-warning/5 rounded-lg text-sm">
                      {selectedOS.modo_falha && <div><Label className="text-xs text-muted-foreground">Modo de Falha</Label><p>{selectedOS.modo_falha}</p></div>}
                      {selectedOS.causa_raiz && <div><Label className="text-xs text-muted-foreground">Causa Raiz</Label><p>{selectedOS.causa_raiz}</p></div>}
                      {selectedOS.acao_corretiva && <div><Label className="text-xs text-muted-foreground">Ação Corretiva</Label><p>{selectedOS.acao_corretiva}</p></div>}
                      {selectedOS.licoes_aprendidas && <div><Label className="text-xs text-muted-foreground">Lições Aprendidas</Label><p>{selectedOS.licoes_aprendidas}</p></div>}
                    </div>
                  </div>
                )}

                {execucao && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-sm">Dados da Execução</h4>
                    <div className="grid grid-cols-2 gap-4 p-3 bg-success/5 rounded-lg text-sm">
                      <div><Label className="text-xs text-muted-foreground">Mecânico</Label><p>{execucao.mecanico_nome}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Tempo</Label><p className="font-mono">{execucao.hora_inicio} - {execucao.hora_fim} ({execucao.tempo_execucao}min)</p></div>
                      <div><Label className="text-xs text-muted-foreground">Data Fechamento</Label><p>{selectedOS.data_fechamento ? new Date(selectedOS.data_fechamento).toLocaleDateString('pt-BR') : '-'}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Custo Total</Label><p className="font-mono font-medium text-success">R$ {Number(execucao.custo_total || 0).toFixed(2)}</p></div>
                    </div>
                    {execucao.servico_executado && <div className="mt-3"><Label className="text-xs text-muted-foreground">Serviço Executado</Label><p className="mt-1 p-3 bg-muted/50 rounded-lg text-sm">{execucao.servico_executado}</p></div>}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
