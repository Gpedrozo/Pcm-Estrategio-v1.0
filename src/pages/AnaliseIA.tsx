import { useState, useRef } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, Printer, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

export default function AnaliseIA() {
  const { empresa } = useEmpresa();
  const [analise, setAnalise] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataGeracao, setDataGeracao] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const handleAnalise = async () => {
    if (!empresa?.id) {
      toast({ title: 'Erro', description: 'Empresa não identificada.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setAnalise('');

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analise-ia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ empresa_id: empresa.id }),
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
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAnalise(fullText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
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
            if (content) {
              fullText += content;
              setAnalise(fullText);
            }
          } catch { /* ignore */ }
        }
      }

      setDataGeracao(new Date().toLocaleString('pt-BR'));
    } catch (error: any) {
      console.error('Erro na análise IA:', error);
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível gerar a análise.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between no-print">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Análise Inteligente (IA)
          </h1>
          <p className="page-subtitle">
            Análise preditiva baseada em IA com dados completos do sistema de manutenção
          </p>
        </div>
        <div className="flex gap-2">
          {analise && (
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          )}
          <Button
            onClick={handleAnalise}
            disabled={isLoading}
            className="btn-industrial gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {analise ? 'Nova Análise' : 'Gerar Análise'}
              </>
            )}
          </Button>
        </div>
      </div>

      {!analise && !isLoading && (
        <Card className="card-industrial">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Análise Preditiva com Inteligência Artificial
            </h3>
            <p className="text-muted-foreground max-w-lg mb-6">
              O sistema analisa automaticamente suas ordens de serviço, equipamentos, custos,
              planos preventivos, lubrificação e FMEA para gerar insights e previsões detalhadas.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <span className="font-semibold text-foreground">📋 OS</span>
                <span>Histórico completo</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <span className="font-semibold text-foreground">🔧 Equipamentos</span>
                <span>Criticidade e risco</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <span className="font-semibold text-foreground">💰 Custos</span>
                <span>MO, materiais, terceiros</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50">
                <span className="font-semibold text-foreground">⚠️ FMEA</span>
                <span>RPN e análises</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && !analise && (
        <Card className="card-industrial">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Analisando dados de manutenção com IA...
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Isso pode levar alguns segundos
            </p>
          </CardContent>
        </Card>
      )}

      {analise && (
        <div ref={printRef}>
          {/* Print header */}
          <div className="hidden print:block mb-6 pb-4 border-b-2 border-foreground">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{empresa?.nome || 'PCM ESTRATÉGICO'}</h1>
                <p className="text-xs">Sistema de Gestão de Manutenção Industrial</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold">Análise Inteligente (IA)</p>
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
                <span className="text-xs text-muted-foreground">
                  {dataGeracao && `Gerado em: ${dataGeracao}`}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground">
                <ReactMarkdown>{analise}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Print footer */}
          <div className="hidden print:block mt-8 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>PCM ESTRATÉGICO — {empresa?.nome}</span>
              <span>{dataGeracao}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
