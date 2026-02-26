import type { Tables } from '@/integrations/supabase/types';

// Re-export typed rows from Supabase schema
export type Empresa = Tables<'empresas'>;
export type OrdemServico = Tables<'ordens_servico'>;
export type Equipamento = Tables<'equipamentos'>;
export type Mecanico = Tables<'mecanicos'>;
export type Material = Tables<'materiais'>;
export type Fornecedor = Tables<'fornecedores'>;
export type Contrato = Tables<'contratos'>;
export type PlanoPreventivo = Tables<'planos_preventivos'>;
export type Lubrificacao = Tables<'lubrificacao'>;
export type Inspecao = Tables<'inspecoes'>;
export type Fmea = Tables<'fmea'>;
export type AnaliseCausaRaiz = Tables<'analise_causa_raiz'>;
export type Melhoria = Tables<'melhorias'>;
export type SSMARegistro = Tables<'ssma_registros'>;
export type DocumentoTecnico = Tables<'documentos_tecnicos'>;
export type ExecucaoOS = Tables<'execucoes_os'>;
export type MaterialUtilizado = Tables<'materiais_utilizados'>;
export type Solicitacao = Tables<'solicitacoes'>;
export type Auditoria = Tables<'auditoria'>;
export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;
export type PlanoSaas = Tables<'planos_saas'>;
export type Assinatura = Tables<'assinaturas'>;

// Dashboard Indicators
export interface Indicadores {
  osAbertas: number;
  osEmAndamento: number;
  osFechadas: number;
  tempoMedioExecucao: number;
  tempoMedioAtendimento: number;
  mtbf: number;
  mttr: number;
  disponibilidade: number;
  backlogQuantidade: number;
  backlogTempo: number;
  backlogSemanas: number;
  aderenciaProgramacao: number;
  custoTotalMes: number;
  custoMaoObraMes: number;
  custoMateriaisMes: number;
  custoTerceirosMes: number;
}

export type StatusOS = 'ABERTA' | 'EM_ANDAMENTO' | 'AGUARDANDO_MATERIAL' | 'AGUARDANDO_APROVACAO' | 'FECHADA';
export type TipoOS = 'CORRETIVA' | 'PREVENTIVA' | 'PREDITIVA' | 'INSPECAO' | 'MELHORIA';
export type PrioridadeOS = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';
