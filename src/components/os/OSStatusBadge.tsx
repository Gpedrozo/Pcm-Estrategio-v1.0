import { cn } from '@/lib/utils';
import type { StatusOS } from '@/types';

interface OSStatusBadgeProps {
  status: StatusOS;
  className?: string;
}

const statusConfig: Record<StatusOS, { label: string; className: string }> = {
  ABERTA: { label: 'Aberta', className: 'status-aberta' },
  EM_ANDAMENTO: { label: 'Em Andamento', className: 'status-andamento' },
  AGUARDANDO_MATERIAL: { label: 'Aguard. Material', className: 'bg-warning/10 text-warning border border-warning/20' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. Aprovação', className: 'bg-muted text-muted-foreground border border-border' },
  FECHADA: { label: 'Fechada', className: 'status-fechada' },
};

export function OSStatusBadge({ status, className }: OSStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium", config?.className, className)}>
      {config?.label || status}
    </span>
  );
}
