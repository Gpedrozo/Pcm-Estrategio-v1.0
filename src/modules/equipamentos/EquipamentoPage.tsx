import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, QrCode, Wrench } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useEnterpriseServices } from '@/core/presentation/useEnterpriseServices';
import { requireTenantContext } from '@/core/infrastructure/tenancy/tenantGuard';
import ArvoreEstrutural from './ArvoreEstrutural';
import AbrirOrdemServico from './AbrirOrdemServico';

type Equipamento = Database['public']['Tables']['equipamentos']['Row'];

interface ComponenteSelecionado {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
}

export default function EquipamentoPage() {
  const { tag } = useParams();
  const { isAdmin, user } = useAuth();
  const { empresa } = useEmpresa();
  const { getEquipamentoByTagUseCase } = useEnterpriseServices();
  const [loading, setLoading] = useState(true);
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [selectedComponente, setSelectedComponente] = useState<ComponenteSelecionado | null>(null);
  const [openOSDialog, setOpenOSDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const tenant = requireTenantContext({
          empresaId: empresa?.id || null,
          userId: user?.id || null,
          userName: user?.nome || null,
        });

        const data = await getEquipamentoByTagUseCase.execute(String(tag || ''), tenant);
        setEquipamento(data || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao carregar equipamento';
        toast({ title: 'Falha ao carregar equipamento', description: message, variant: 'destructive' });
        setEquipamento(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [empresa?.id, getEquipamentoByTagUseCase, tag, user?.id, user?.nome]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!equipamento) return <Card className="card-industrial"><CardContent className="p-8 text-center text-muted-foreground">Equipamento não encontrado para TAG: <strong>{String(tag || '').toUpperCase()}</strong></CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><QrCode className="h-6 w-6 text-primary" />Equipamento via QR Code</h1>
        <p className="page-subtitle">Fluxo rápido de manutenção: selecionar componente e abrir O.S.</p>
      </div>

      <Card className="card-industrial">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="font-mono text-primary">{equipamento.tag}</span>
            <span>{equipamento.nome}</span>
            <Badge variant={equipamento.ativo ? 'default' : 'secondary'} className="ml-auto">{equipamento.ativo ? 'Ativo' : 'Inativo'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-xs text-muted-foreground">Localização</p><p>{equipamento.localizacao || '-'}</p></div>
          <div><p className="text-xs text-muted-foreground">Fabricante</p><p>{equipamento.fabricante || '-'}</p></div>
          <div><p className="text-xs text-muted-foreground">Modelo</p><p>{equipamento.modelo || '-'}</p></div>
          <div><p className="text-xs text-muted-foreground">Status</p><p>{equipamento.ativo ? 'Operacional' : 'Inativo'}</p></div>
        </CardContent>
      </Card>

      <Card className="card-industrial">
        <CardHeader><CardTitle>Árvore Estrutural</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ArvoreEstrutural
            equipamentoId={equipamento.id}
            onSelectComponente={(node) => setSelectedComponente(node)}
            selectedComponenteId={selectedComponente?.id}
          />

          {selectedComponente && (
            <div className="rounded-md border p-3 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Componente selecionado</p>
                <p className="text-sm text-muted-foreground">{selectedComponente.codigo} - {selectedComponente.nome}</p>
              </div>
              {isAdmin ? (
                <Button className="btn-industrial gap-2" onClick={() => setOpenOSDialog(true)}>
                  <Wrench className="h-4 w-4" />Abrir Ordem de Serviço
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Seu perfil pode consultar estrutura, mas não abrir O.S.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openOSDialog} onOpenChange={setOpenOSDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Abertura Inteligente de O.S.</DialogTitle></DialogHeader>
          {selectedComponente && (
            <AbrirOrdemServico
              equipamento={{ tag: equipamento.tag, nome: equipamento.nome, localizacao: equipamento.localizacao }}
              componente={selectedComponente}
              onSuccess={() => setOpenOSDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
