import { useState, useRef, useEffect } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Loader2, Printer, Wrench, CalendarIcon, TrendingUp, Search, History, Eye, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ModoAnalise = 'equipamento' | 'periodo' | 'top-problemas';

interface HistoricoItem {
  id: string;
  modo: string;
  tag: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  resultado: string;
  usuario_nome: string;
  created_at: string;
}

export default function AnaliseIA() {
  const { empresa } = useEmpresa();
  const { user } = useAuth();
  const [analise, setAnalise] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataGeracao, setDataGeracao] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('analise');

  // Filtros de análise
  const [modoAnalise, setModoAnalise] = useState<ModoAnalise>('top-problemas');
  const [equipamentos, setEquipamentos] = useState<{ tag: string; nome: string }[]>([]);
  const [tagSelecionada, setTagSelecionada] = useState('');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  // Histórico
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<HistoricoItem | null>(null);

  // Filtros do histórico
  const [filtroModo, setFiltroModo] = useState<string>('todos');
  const [filtroBusca, setFiltroBusca] = useState('');

  useEffect(() => {
    if (empresa?.id) {
      supabase
        .from('equipamentos')
        .select('tag, nome')
        .eq('empresa_id', empresa.id)
        .eq('ativo', true)
        .order('tag')
        .then(({ data }) => {
          if (data) setEquipamentos(data);
        });
    }
  }, [empresa?.id]);

  const fetchHistorico = async () => {
    if (!empresa?.id) return;
    setLoadingHistorico(true);
    const { data, error } = await supabase
      .from('historico_analises_ia')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setHistorico(data as HistoricoItem[]);
    if (error) console.error(error);
    setLoadingHistorico(false);
  };

  useEffect(() => {
    if (activeTab === 'historico') fetchHistorico();
  }, [activeTab, empresa?.id]);

  const salvarHistorico = async (resultado: string) => {
    if (!empresa?.id) return;
    await supabase.from('historico_analises_ia').insert({
      empresa_id: empresa.id,
      modo: modoAnalise,
      tag: modoAnalise === 'equipamento' ? tagSelecionada : null,
      data_inicio: modoAnalise === 'periodo' && dataInicio ? dataInicio.toISOString().split('T')[0] : null,
      data_fim: modoAnalise === 'periodo' && dataFim ? dataFim.toISOString().split('T')[0] : null,
      resultado,
      usuario_id: user?.id || null,
      usuario_nome: user?.nome || 'Sistema',
    });
  };

  const handleAnalise = async () => {
    if (!empresa?.id) {
      toast({ title: 'Erro', description: 'Empresa não identificada.', variant: 'destructive' });
      return;
    }
    if (modoAnalise === 'equipamento' && !tagSelecionada) {
      toast({ title: 'Selecione um equipamento', description: 'Escolha o equipamento para análise.', variant: 'destructive' });
      return;
    }
    if (modoAnalise === 'periodo' && (!dataInicio || !dataFim)) {
      toast({ title: 'Selecione o período', description: 'Defina data início e fim.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setAnalise('');

    const body: any = { empresa_id: empresa.id, modo: modoAnalise };
    if (modoAnalise === 'equipamento') body.tag = tagSelecionada;
    if (modoAnalise === 'periodo') {
      body.data_inicio = dataInicio!.toISOString();
      body.data_fim = dataFim!.toISOString();
    }

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analise-ia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }
      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullText = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullText += content; setAnalise(fullText); }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullText += content; setAnalise(fullText); }
          } catch { /* ignore */ }
        }
      }

      setDataGeracao(new Date().toLocaleString('pt-BR'));
      if (fullText) await salvarHistorico(fullText);

    } catch (error: any) {
      console.error('Erro na análise IA:', error);
      toast({ title: 'Erro na análise', description: error.message || 'Não foi possível gerar a análise.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistorico = async (id: string) => {
    const { error } = await supabase
      .from('historico_analises_ia')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresa?.id || '');
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    } else {
      setHistorico(prev => prev.filter(h => h.id !== id));
      toast({ title: 'Excluído', description: 'Análise removida do histórico.' });
    }
  };

  const getModoLabel = (modo?: string) => {
    const m = modo || modoAnalise;
    switch (m) {
      case 'equipamento': return 'Equipamento';
      case 'periodo': return 'Período';
      case 'top-problemas': return 'Top Problemas';
      default: return m;
    }
  };

  const getModoLabelFull = () => {
    switch (modoAnalise) {
      case 'equipamento': return `Equipamento: ${tagSelecionada}`;
      case 'periodo': return `${dataInicio ? format(dataInicio, 'dd/MM/yy') : ''} — ${dataFim ? format(dataFim, 'dd/MM/yy') : ''}`;
      case 'top-problemas': return 'Top Problemas';
    }
  };

  // Filtrar histórico
  const historicoFiltrado = historico.filter((item) => {
    if (filtroModo !== 'todos' && item.modo !== filtroModo) return false;
    if (filtroBusca) {
      const busca = filtroBusca.toLowerCase();
      const matchTag = item.tag?.toLowerCase().includes(busca);
      const matchUser = item.usuario_nome.toLowerCase().includes(busca);
      const matchDate = format(new Date(item.created_at), 'dd/MM/yyyy').includes(busca);
      if (!matchTag && !matchUser && !matchDate) return false;
    }
    return true;
  });

  const modos = [
    { value: 'equipamento' as ModoAnalise, icon: Wrench, label: 'Equipamento', desc: 'Analisa uma TAG específica' },
    { value: 'periodo' as ModoAnalise, icon: CalendarIcon, label: 'Período', desc: 'Intervalo de datas' },
    { value: 'top-problemas' as ModoAnalise, icon: TrendingUp, label: 'Top Problemas', desc: 'Maiores incidências' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Brain className="h-6 w-6 text-primary" />
            Análise IA
          </h1>
          <p className="text-sm text-muted-foreground">Diagnóstico inteligente de manutenção</p>
        </div>
        {analise && (
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
        <TabsList>
          <TabsTrigger value="analise" className="gap-1.5">
            <Brain className="h-4 w-4" /> Nova Análise
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* ─── Nova Análise ─── */}
        <TabsContent value="analise" className="space-y-4 mt-4">
          {/* Modo cards */}
          <div className="grid grid-cols-3 gap-3">
            {modos.map((m) => {
              const Icon = m.icon;
              const sel = modoAnalise === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => { setModoAnalise(m.value); setAnalise(''); }}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all',
                    sel ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  )}
                >
                  <div className={cn('p-2 rounded-lg', sel ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn('font-medium text-sm', sel && 'text-primary')}>{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filtros + botão */}
          <div className="flex flex-wrap items-end gap-3">
            {modoAnalise === 'equipamento' && (
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Equipamento</label>
                <Select value={tagSelecionada} onValueChange={setTagSelecionada}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {equipamentos.map((eq) => (
                      <SelectItem key={eq.tag} value={eq.tag}>
                        <span className="font-mono font-semibold">{eq.tag}</span>
                        <span className="text-muted-foreground ml-2">— {eq.nome}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {modoAnalise === 'periodo' && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Início</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-[160px] justify-start text-left font-normal', !dataInicio && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataInicio ? format(dataInicio, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} locale={ptBR} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Fim</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-[160px] justify-start text-left font-normal', !dataFim && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataFim ? format(dataFim, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dataFim} onSelect={setDataFim} locale={ptBR} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {modoAnalise === 'top-problemas' && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                A IA identifica automaticamente os equipamentos mais problemáticos.
              </p>
            )}

            <Button onClick={handleAnalise} disabled={isLoading} className="gap-2 ml-auto">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Analisando...</> : <><Search className="h-4 w-4" />Analisar</>}
            </Button>
          </div>

          {/* Empty / Loading */}
          {!analise && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed border-border">
              <Brain className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Selecione o modo e clique em <strong>Analisar</strong></p>
            </div>
          )}
          {isLoading && !analise && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Analisando dados com IA...</p>
            </div>
          )}
        </TabsContent>

        {/* ─── Histórico ─── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          {/* Filtros do histórico */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por TAG, usuário ou data..."
                value={filtroBusca}
                onChange={(e) => setFiltroBusca(e.target.value)}
                className="h-9"
              />
            </div>
            <Select value={filtroModo} onValueChange={setFiltroModo}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os modos</SelectItem>
                <SelectItem value="equipamento">Equipamento</SelectItem>
                <SelectItem value="periodo">Período</SelectItem>
                <SelectItem value="top-problemas">Top Problemas</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs">
              {historicoFiltrado.length} resultado{historicoFiltrado.length !== 1 && 's'}
            </Badge>
          </div>

          {loadingHistorico ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : historicoFiltrado.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed border-border">
              <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{historico.length === 0 ? 'Nenhuma análise realizada ainda.' : 'Nenhum resultado para os filtros aplicados.'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoFiltrado.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(item.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{getModoLabel(item.modo)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.modo === 'equipamento' && item.tag && <span className="font-mono font-semibold text-foreground">{item.tag}</span>}
                      {item.modo === 'periodo' && item.data_inicio && item.data_fim && (
                        <span>{format(new Date(item.data_inicio), 'dd/MM/yy')} — {format(new Date(item.data_fim), 'dd/MM/yy')}</span>
                      )}
                      {item.modo === 'top-problemas' && <span>Geral</span>}
                    </TableCell>
                    <TableCell className="text-sm">{item.usuario_nome}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistoricoSelecionado(item)} title="Ver">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteHistorico(item.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Resultado (fora das tabs para impressão) */}
      {analise && (
        <div ref={printRef}>
          <div className="hidden print:block mb-4 pb-3 border-b-2 border-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{empresa?.nome || 'PCM ESTRATÉGICO'}</h1>
                <p className="text-xs">Manutenção Industrial</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold">Análise IA — {getModoLabelFull()}</p>
                <p>{dataGeracao}</p>
              </div>
            </div>
          </div>

          <Card className="print:shadow-none print:border-0">
            <CardHeader className="no-print pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-primary" />
                  Resultado
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{getModoLabelFull()}</Badge>
                  {dataGeracao && <span className="text-xs text-muted-foreground">{dataGeracao}</span>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground">
                <ReactMarkdown>{analise}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <div className="hidden print:block mt-6 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>PCM ESTRATÉGICO — {empresa?.nome}</span>
              <span>{dataGeracao}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dialog histórico */}
      <Dialog open={!!historicoSelecionado} onOpenChange={() => setHistoricoSelecionado(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {historicoSelecionado && getModoLabel(historicoSelecionado.modo)}
              {historicoSelecionado?.tag && <Badge variant="outline" className="ml-1 font-mono text-xs">{historicoSelecionado.tag}</Badge>}
            </DialogTitle>
            {historicoSelecionado && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(historicoSelecionado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} — {historicoSelecionado.usuario_nome}
              </p>
            )}
          </DialogHeader>
          {historicoSelecionado && (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground">
              <ReactMarkdown>{historicoSelecionado.resultado}</ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
