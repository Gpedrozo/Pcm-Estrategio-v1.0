import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresaQuery } from '@/hooks/useEmpresaQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function FecharOS() {
  const { user } = useAuth();
  const { fromEmpresa } = useEmpresaQuery();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [closingForm, setClosingForm] = useState({ servico_executado: '', modo_falha: '', causa_raiz: '', acao_corretiva: '', licoes_aprendidas: '' });
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => { loadOrdens(); }, [fromEmpresa]);

  async function loadOrdens() {
    const { data } = await fromEmpresa('ordens_servico')
      .in('status', ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_MATERIAL', 'AGUARDANDO_APROVACAO'])
      .order('created_at', { ascending: false });
    setOrdens(data || []);
    setIsLoading(false);
  }

  const handleClose = async () => {
    if (!selectedOS) return;
    setIsClosing(true);
    try {
      const { error } = await supabase.from('ordens_servico').update({
        status: 'FECHADA', data_fechamento: new Date().toISOString(), usuario_fechamento: user?.nome,
        modo_falha: closingForm.modo_falha || null, causa_raiz: closingForm.causa_raiz || null,
        acao_corretiva: closingForm.acao_corretiva || null, licoes_aprendidas: closingForm.licoes_aprendidas || null,
      }).eq('id', selectedOS.id);
      if (error) throw error;
      toast({ title: `O.S #${selectedOS.numero_os} fechada com sucesso!` });
      setSelectedOS(null);
      setClosingForm({ servico_executado: '', modo_falha: '', causa_raiz: '', acao_corretiva: '', licoes_aprendidas: '' });
      loadOrdens();
    } catch (error: any) {
      toast({ title: 'Erro ao fechar O.S', description: error.message, variant: 'destructive' });
    } finally { setIsClosing(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header"><h1 className="page-title">Fechar Ordem de Serviço</h1><p className="page-subtitle">{ordens.length} ordens em aberto</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-industrial"><CardHeader><CardTitle>Selecionar O.S</CardTitle></CardHeader><CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {ordens.map(os => (
            <button key={os.id} onClick={() => setSelectedOS(os)} className={`w-full text-left p-3 rounded-md border transition-colors ${selectedOS?.id === os.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
              <div className="flex items-center justify-between"><span className="font-mono font-medium">#{os.numero_os}</span><Badge variant="outline">{os.tipo}</Badge></div>
              <p className="text-sm text-muted-foreground mt-1">{os.tag} - {os.equipamento}</p>
            </button>
          ))}
          {ordens.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma O.S em aberto</p>}
        </CardContent></Card>
        {selectedOS && (
          <Card className="card-industrial"><CardHeader><CardTitle>Fechar O.S #{selectedOS.numero_os}</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Modo de Falha</Label><Input value={closingForm.modo_falha} onChange={(e) => setClosingForm(prev => ({ ...prev, modo_falha: e.target.value }))} placeholder="Ex: Desgaste, Fadiga..." /></div>
            <div className="space-y-2"><Label>Causa Raiz</Label><Input value={closingForm.causa_raiz} onChange={(e) => setClosingForm(prev => ({ ...prev, causa_raiz: e.target.value }))} placeholder="Ex: Falta de manutenção..." /></div>
            <div className="space-y-2"><Label>Ação Corretiva</Label><Textarea value={closingForm.acao_corretiva} onChange={(e) => setClosingForm(prev => ({ ...prev, acao_corretiva: e.target.value }))} rows={3} /></div>
            <div className="space-y-2"><Label>Lições Aprendidas</Label><Textarea value={closingForm.licoes_aprendidas} onChange={(e) => setClosingForm(prev => ({ ...prev, licoes_aprendidas: e.target.value }))} rows={3} /></div>
            <Button onClick={handleClose} className="btn-industrial gap-2 w-full" disabled={isClosing}>{isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}Fechar O.S</Button>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
