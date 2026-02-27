import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ManuaisEquipamento from '@/components/equipamentos/ManuaisEquipamento';

interface Equipamento {
  id: string;
  tag: string;
  nome: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipamento: Equipamento | null;
}

export default function ManuaisAtivoDialog({ open, onOpenChange, equipamento }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Manuais do Ativo {equipamento ? `— ${equipamento.tag}` : ''}
          </DialogTitle>
        </DialogHeader>

        {equipamento && (
          <ManuaisEquipamento equipamentoId={equipamento.id} equipamentoTag={equipamento.tag} />
        )}
      </DialogContent>
    </Dialog>
  );
}
