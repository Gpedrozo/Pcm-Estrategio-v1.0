import { cn } from '@/lib/utils';
import type { TipoOS } from '@/types';

interface OSTypeBadgeProps {
  tipo: TipoOS;
  className?: string;
}

const tipoConfig: Record<TipoOS, { label: string; className: string }> = {
  CORRETIVA: { label: 'Corretiva', className: 'bg-destructive/10 text-destructive border border-destructive/20' },
  PREVENTIVA: { label: 'Preventiva', className: 'bg-info/10 text-info border border-info/20' },
  PREDITIVA: { label: 'Preditiva', className: 'bg-primary/10 text-primary border border-primary/20' },
  INSPECAO: { label: 'Inspeção', className: 'bg-warning/10 text-warning border border-warning/20' },
  MELHORIA: { label: 'Melhoria', className: 'bg-success/10 text-success border border-success/20' },
};

export function OSTypeBadge({ tipo, className }: OSTypeBadgeProps) {
  const config = tipoConfig[tipo];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", config?.className, className)}>
      {config?.label || tipo}
    </span>
  );
}
