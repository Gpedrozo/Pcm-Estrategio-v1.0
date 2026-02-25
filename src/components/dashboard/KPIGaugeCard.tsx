import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPIGaugeCardProps {
  title: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  target?: number;
  thresholds?: { warning: number; critical: number };
  icon: LucideIcon;
  description?: string;
}

export function KPIGaugeCard({ title, value, unit, min = 0, max = 100, target, thresholds, icon: Icon, description }: KPIGaugeCardProps) {
  const percentage = Math.min(((value - min) / (max - min)) * 100, 100);

  const getColor = () => {
    if (!thresholds) return 'text-primary';
    if (value >= thresholds.critical) return 'text-destructive';
    if (value >= thresholds.warning) return 'text-warning';
    return 'text-success';
  };

  const isInverted = title.toLowerCase().includes('disponibilidade') || title.toLowerCase().includes('aderência');

  const getStatusColor = () => {
    if (isInverted) {
      if (value >= 95) return 'bg-success';
      if (value >= 80) return 'bg-warning';
      return 'bg-destructive';
    }
    if (!thresholds) return 'bg-primary';
    if (value >= thresholds.critical) return 'bg-destructive';
    if (value >= thresholds.warning) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-lg bg-muted", getColor())}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-3xl font-bold font-mono", getColor())}>
            {value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          </span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
        {target && <p className="text-xs text-muted-foreground mt-1">Meta: {target}{unit}</p>}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", getStatusColor())} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">{min}</span>
        {target && <span className="text-[10px] text-primary font-medium">▼ {target}</span>}
        <span className="text-[10px] text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}
