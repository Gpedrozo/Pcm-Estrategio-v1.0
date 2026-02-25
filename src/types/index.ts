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
export type PlanoSaas = Tables<'planos_saas'>;
export type Assinatura = Tables<'assinaturas'>;

// Module mapping for sidebar/route protection
export const MODULO_ROTAS: Record<string, string[]> = {
  dashboard: ['/dashboard'],
  ordens_servico: ['/solicitacoes', '/backlog', '/os/nova', '/os/fechar', '/os/historico'],
  planejamento: ['/lubrificacao', '/programacao', '/preventiva', '/preditiva', '/inspecoes'],
  analises: ['/fmea', '/rca', '/melhorias'],
  cadastros: ['/hierarquia', '/equipamentos', '/mecanicos', '/materiais', '/fornecedores', '/contratos', '/documentos'],
  relatorios: ['/custos', '/relatorios'],
  ssma: ['/ssma'],
};

// Reverse map: route -> module
export const ROTA_MODULO: Record<string, string> = {};
Object.entries(MODULO_ROTAS).forEach(([modulo, rotas]) => {
  rotas.forEach(rota => {
    ROTA_MODULO[rota] = modulo;
  });
});
