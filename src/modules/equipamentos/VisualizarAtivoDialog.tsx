import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ArvoreEstrutural from '@/components/equipamentos/ArvoreEstrutural';
import ManuaisEquipamento from '@/components/equipamentos/ManuaisEquipamento';
import GerarQRCode from '@/modules/equipamentos/GerarQRCode';
import ImprimirEtiqueta from '@/modules/equipamentos/ImprimirEtiqueta';

interface Equipamento {
  id: string;
  tag: string;
  nome: string;
  localizacao: string | null;
  fabricante: string | null;
  modelo: string | null;
  numero_serie: string | null;
  created_at: string;
  ativo: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento: Equipamento | null;
}

function splitSetorLocal(localizacao: string | null) {
  const value = localizacao || '';
  const parts = value.split('/').map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { setor: parts[0], local: parts.slice(1).join(' / ') };
  }
  return { setor: '-', local: value || '-' };
}

export default function VisualizarAtivoDialog({ open, onOpenChange, equipamento }: Props) {
  if (!equipamento) return null;

  const { setor, local } = splitSetorLocal(equipamento.localizacao);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-primary text-xl">{equipamento.tag}</span>
            <Separator orientation="vertical" className="h-6" />
            <span>{equipamento.nome}</span>
            <Badge variant={equipamento.ativo ? 'default' : 'secondary'} className="ml-auto">
              {equipamento.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Informações</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
            <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <InfoField label="TAG" value={equipamento.tag} mono />
              <InfoField label="Descrição" value={equipamento.nome} />
              <InfoField label="Setor" value={setor} />
              <InfoField label="Local" value={local} />
              <InfoField label="Fabricante" value={equipamento.fabricante || '-'} />
              <InfoField label="Modelo" value={equipamento.modelo || '-'} />
              <InfoField label="Número de Série" value={equipamento.numero_serie || '-'} mono />
              <InfoField label="Data de Cadastro" value={new Date(equipamento.created_at).toLocaleDateString('pt-BR')} />
              <InfoField label="Status" value={equipamento.ativo ? 'Ativo' : 'Inativo'} />
            </div>
          </TabsContent>

          <TabsContent value="qr" className="mt-4 space-y-6">
            <GerarQRCode tag={equipamento.tag} nome={equipamento.nome} />
            <Separator />
            <ImprimirEtiqueta tag={equipamento.tag} nome={equipamento.nome} />
          </TabsContent>

          <TabsContent value="estrutura" className="mt-4">
            <ArvoreEstrutural equipamentoId={equipamento.id} equipamentoTag={equipamento.tag} readOnly />
          </TabsContent>

          <TabsContent value="documentos" className="mt-4">
            <ManuaisEquipamento equipamentoId={equipamento.id} equipamentoTag={equipamento.tag} readOnly />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
