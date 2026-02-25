import { RelatorioPDF } from './RelatorioPDF';
import { Badge } from '@/components/ui/badge';
import type { OrdemServico } from '@/types';

interface RelatorioOSProps {
  os: OrdemServico;
}

export function RelatorioOS({ os }: RelatorioOSProps) {
  return (
    <RelatorioPDF titulo={`Ordem de Serviço #${os.numero_os}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Nº OS:</strong> {os.numero_os}</div>
          <div><strong>Tipo:</strong> {os.tipo}</div>
          <div><strong>TAG:</strong> {os.tag}</div>
          <div><strong>Equipamento:</strong> {os.equipamento}</div>
          <div><strong>Prioridade:</strong> {os.prioridade}</div>
          <div><strong>Status:</strong> {os.status}</div>
          <div><strong>Solicitante:</strong> {os.solicitante}</div>
          <div><strong>Data:</strong> {new Date(os.data_solicitacao).toLocaleDateString('pt-BR')}</div>
        </div>

        <div className="border-t pt-3">
          <strong className="text-sm">Problema:</strong>
          <p className="text-sm mt-1">{os.problema}</p>
        </div>

        {os.causa_raiz && (
          <div className="border-t pt-3">
            <strong className="text-sm">Causa Raiz:</strong>
            <p className="text-sm mt-1">{os.causa_raiz}</p>
          </div>
        )}

        {os.acao_corretiva && (
          <div className="border-t pt-3">
            <strong className="text-sm">Ação Corretiva:</strong>
            <p className="text-sm mt-1">{os.acao_corretiva}</p>
          </div>
        )}

        {os.licoes_aprendidas && (
          <div className="border-t pt-3">
            <strong className="text-sm">Lições Aprendidas:</strong>
            <p className="text-sm mt-1">{os.licoes_aprendidas}</p>
          </div>
        )}
      </div>
    </RelatorioPDF>
  );
}
