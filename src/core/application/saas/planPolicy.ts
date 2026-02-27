export type PlanoSaaS = 'BASICO' | 'PROFISSIONAL' | 'ENTERPRISE';

export interface PlanoRuntimeContext {
  plano: PlanoSaaS;
  modulosAtivos: string[];
  maxUsuarios?: number;
  maxEquipamentos?: number;
  maxOrdensServicoMes?: number;
}

const PLAN_LIMITS: Record<PlanoSaaS, { usuarios: number; equipamentos: number; osMes: number }> = {
  BASICO: { usuarios: 20, equipamentos: 2000, osMes: 10000 },
  PROFISSIONAL: { usuarios: 200, equipamentos: 25000, osMes: 150000 },
  ENTERPRISE: { usuarios: 2000, equipamentos: 250000, osMes: 2000000 },
};

export function isModuloHabilitado(modulo: string, context: PlanoRuntimeContext) {
  return context.modulosAtivos.includes(modulo);
}

export function canCreateUsuario(currentCount: number, context: PlanoRuntimeContext) {
  const max = context.maxUsuarios ?? PLAN_LIMITS[context.plano].usuarios;
  return currentCount < max;
}

export function canCreateEquipamento(currentCount: number, context: PlanoRuntimeContext) {
  const max = context.maxEquipamentos ?? PLAN_LIMITS[context.plano].equipamentos;
  return currentCount < max;
}

export function canCreateOrdemServicoMes(currentCount: number, context: PlanoRuntimeContext) {
  const max = context.maxOrdensServicoMes ?? PLAN_LIMITS[context.plano].osMes;
  return currentCount < max;
}
