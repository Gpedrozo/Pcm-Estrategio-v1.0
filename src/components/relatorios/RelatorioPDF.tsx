import { useEmpresa } from '@/contexts/EmpresaContext';
import gppisLogo from '@/assets/gppis-logo.png';

interface RelatorioPDFProps {
  titulo: string;
  children: React.ReactNode;
}

export function RelatorioPDF({ titulo, children }: RelatorioPDFProps) {
  const { empresa } = useEmpresa();
  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="print-container">
      {/* Header */}
      <div className="print-header flex items-center justify-between border-b-2 border-foreground pb-3 mb-6">
        <div className="flex items-center gap-3">
          {empresa?.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nome} className="h-12 w-auto" />
          ) : (
            <img src={gppisLogo} alt="GPPIS" className="h-10 w-auto" />
          )}
          <div>
            <h1 className="text-lg font-bold">{empresa?.nome || 'PCM ESTRATÉGICO'}</h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestão de Manutenção Industrial</p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-sm text-foreground">{titulo}</p>
          <p>Gerado em: {dataGeracao}</p>
        </div>
      </div>

      {/* Content */}
      <div className="print-content">
        {children}
      </div>

      {/* Footer */}
      <div className="print-footer border-t border-border pt-2 mt-8 text-xs text-muted-foreground flex justify-between">
        <span>PCM ESTRATÉGICO — {empresa?.nome}</span>
        <span>{dataGeracao}</span>
      </div>
    </div>
  );
}
