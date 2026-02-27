export type AppRole = 'ADMIN' | 'GESTOR' | 'USUARIO' | 'SOLICITANTE' | 'MASTER_TI';

export type Criticidade = 'A' | 'B' | 'C';
export type NivelRisco = 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
export type PrioridadeOS = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';

export interface Empresa {
  id: string;
  nome: string;
  plano: string;
  ativo: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: AppRole;
  empresaId: string | null;
}

export interface Equipamento {
  id: string;
  empresa_id: string | null;
  tag: string;
  nome: string;
  criticidade: Criticidade;
  nivel_risco: NivelRisco;
  localizacao: string | null;
  fabricante: string | null;
  modelo: string | null;
  ativo: boolean;
}

export interface Componente {
  id: string;
  equipamento_id: string;
  parent_id: string | null;
  codigo: string;
  nome: string;
  tipo: string;
  criticidade: Criticidade;
}

export interface OrdemServico {
  id: string;
  empresa_id: string | null;
  tag: string;
  equipamento: string;
  componente: string | null;
  local: string | null;
  prioridade: PrioridadeOS;
  problema: string;
  status: string;
}
