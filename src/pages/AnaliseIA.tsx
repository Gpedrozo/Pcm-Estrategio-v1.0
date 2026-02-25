import { useState, useRef, useEffect } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Filtros
  const [modoAnalise, setModoAnalise] = useState<ModoAnalise>('top-problemas');
  const [equipamentos, setEquipamentos] = useState<{ tag: string; nome: string }[]>([]);
  const [tagSelecionada, setTagSelecionada] = useState('');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  // Histórico
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<HistoricoItem | null>(null);

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

      // Salvar no histórico
      if (fullText) await salvarHistorico(fullText);

    } catch (error: any) {
      console.error('Erro na análise IA:', error);
      toast({ title: 'Erro na análise', description: error.message || 'Não foi possível gerar a análise.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistorico = async (id: string) => {
    const { error } = await supabase.from('historico_analises_ia').delete().eq('id', id);
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
      case 'equipamento': return 'Por Equipamento';
      case 'periodo': return 'Por Período';
      case 'top-problemas': return 'Maiores Problemas';
      default: return m;
    }
  };

  const getModoLabelFull = () => {
    switch (modoAnalise) {
      case 'equipamento': return `Equipamento: ${tagSelecionada}`;
      case 'periodo': return `Período: ${dataInicio ? format(dataInicio, 'dd/MM/yy') : ''} - ${dataFim ? format(dataFim, 'dd/MM/yy') : ''}`;
      case 'top-problemas': return 'Maiores Problemas';
    }
  };

  const modos = [
    { value: 'equipamento' as ModoAnalise, icon: Wrench, label: 'Por Equipamento', desc: 'Analisa um equipamento específico' },
    { value: 'periodo' as ModoAnalise, icon: CalendarIcon, label: 'Por Período', desc: 'Analisa um intervalo de datas' },
    { value: 'top-problemas' as ModoAnalise, icon: TrendingUp, label: 'Maiores Problemas', desc: 'Foca nos equipamentos mais problemáticos' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between no-print">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Análise Inteligente (IA)
          </h1>
          <p className="page-subtitle">
            Análise preditiva baseada em IA — selecione o modo de análise desejado
          </p>
        </div>
        <div className="flex gap-2">
          {analise && (
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="no-print">
        <TabsList>
          <TabsTrigger value="analise" className="gap-2">
            <Brain className="h-4 w-4" />
            Nova Análise
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analise" className="space-y-6 mt-4">
          {/* Seleção de modo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modos.map((m) => {
              const Icon = m.icon;
              const selected = modoAnalise === m.value;
              return (
                <Card
                  key={m.value}
                  className={cn(
                    'cursor-pointer transition-all border-2 hover:shadow-md',
                    selected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/40'
                  )}
                  onClick={() => { setModoAnalise(m.value); setAnalise(''); }}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={cn('p-3 rounded-xl', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={cn('font-semibold', selected && 'text-primary')}>{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filtros dinâmicos */}
          <Card className="card-industrial">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-4">
                {modoAnalise === 'equipamento' && (
                  <div className="flex-1 min-w-[250px]">
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Equipamento</label>
                    <Select value={tagSelecionada} onValueChange={setTagSelecionada}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o equipamento..." />
                      </SelectTrigger>
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
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Data Início</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn('w-[180px] justify-start text-left font-normal', !dataInicio && 'text-muted-foreground')}>
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
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Data Fim</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn('w-[180px] justify-start text-left font-normal', !dataFim && 'text-muted-foreground')}>
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    A IA irá identificar automaticamente os equipamentos com maior incidência de problemas.
                  </div>
                )}

                <Button onClick={handleAnalise} disabled={isLoading} className="btn-industrial gap-2 ml-auto" size="lg">
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Analisando...</>
                  ) : (
                    <><Search className="h-4 w-4" />Analisar</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Empty state */}
          {!analise && !isLoading && (
            <Card className="card-industrial">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-14 w-14 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Selecione o modo e clique em Analisar</h3>
                <p className="text-muted-foreground max-w-lg text-sm">
                  Escolha analisar por equipamento específico, por período de tempo, ou deixe a IA encontrar os maiores problemas automaticamente.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading */}
          {isLoading && !analise && (
            <Card className="card-industrial">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analisando dados de manutenção com IA...</p>
                <p className="text-xs text-muted-foreground/60 mt-2">Isso pode levar alguns segundos</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-4">
          <Card className="card-industrial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Análises
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistorico ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma análise realizada ainda.</p>
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
                    {historico.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getModoLabel(item.modo)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.modo === 'equipamento' && item.tag && <span className="font-mono font-semibold text-foreground">{item.tag}</span>}
                          {item.modo === 'periodo' && item.data_inicio && item.data_fim && (
                            <span>{format(new Date(item.data_inicio), 'dd/MM/yy')} — {format(new Date(item.data_fim), 'dd/MM/yy')}</span>
                          )}
                          {item.modo === 'top-problemas' && <span>Análise geral</span>}
                        </TableCell>
                        <TableCell className="text-sm">{item.usuario_nome}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => setHistoricoSelecionado(item)} title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteHistorico(item.id)} title="Excluir" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resultado da análise atual (fora das tabs para impressão) */}
      {analise && (
        <div ref={printRef}>
          <div className="hidden print:block mb-6 pb-4 border-b-2 border-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{empresa?.nome || 'PCM ESTRATÉGICO'}</h1>
                <p className="text-xs">Sistema de Gestão de Manutenção Industrial</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold">Análise IA — {getModoLabelFull()}</p>
                <p>Gerado em: {dataGeracao}</p>
              </div>
            </div>
          </div>

          <Card className="card-industrial print:shadow-none print:border-0">
            <CardHeader className="no-print">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Resultado da Análise
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getModoLabelFull()}</Badge>
                  <span className="text-xs text-muted-foreground">{dataGeracao && `Gerado em: ${dataGeracao}`}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground">
                <ReactMarkdown>{analise}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <div className="hidden print:block mt-8 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>PCM ESTRATÉGICO — {empresa?.nome}</span>
              <span>{dataGeracao}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para visualizar histórico */}
      <Dialog open={!!historicoSelecionado} onOpenChange={() => setHistoricoSelecionado(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Análise — {historicoSelecionado && getModoLabel(historicoSelecionado.modo)}
              {historicoSelecionado?.tag && <Badge variant="outline" className="ml-2 font-mono">{historicoSelecionado.tag}</Badge>}
            </DialogTitle>
            {historicoSelecionado && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(historicoSelecionado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} — por {historicoSelecionado.usuario_nome}
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
