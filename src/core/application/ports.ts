import type { Equipamento, PrioridadeOS } from '@/core/domain/entities';

export interface TenantContext {
  empresaId: string;
  userId: string;
  userName: string;
}

export interface EquipamentoRepository {
  getByTag(tag: string, tenant: TenantContext): Promise<Equipamento | null>;
}

export interface OrdemServicoCreateInput {
  tag: string;
  equipamento: string;
  componente: string;
  local: string | null;
  prioridade: PrioridadeOS;
  problema: string;
  fotos: string[];
}

export interface OrdemServicoRepository {
  createFromQrFlow(input: OrdemServicoCreateInput, tenant: TenantContext): Promise<void>;
}

export interface StructuredLogger {
  info(event: string, payload?: Record<string, unknown>): Promise<void>;
  error(event: string, payload?: Record<string, unknown>): Promise<void>;
}
