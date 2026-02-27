import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ArvoreEstrutural from '@/components/equipamentos/ArvoreEstrutural';

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

export default function EditarArvoreAtivoDialog({ open, onOpenChange, equipamento }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Editar Árvore do Ativo {equipamento ? `— ${equipamento.tag}` : ''}
          </DialogTitle>
        </DialogHeader>

        {equipamento && (
          <ArvoreEstrutural equipamentoId={equipamento.id} equipamentoTag={equipamento.tag} />
        )}
      </DialogContent>
    </Dialog>
  );
}
