export type Empresa = {
  id: string;
  nome: string;
  plano: string;
  ativo: boolean;
};

export type Equipamento = {
  id: string;
  empresa_id: string;
  tag: string;
  nome: string;
  descricao?: string | null;
  criticidade: 'A' | 'B' | 'C';
  ativo: boolean;
};

export type ComponenteEstrutural = {
  id: string;
  empresa_id: string;
  equipamento_id: string;
  parent_id?: string | null;
  nome: string;
  nivel: number;
};

export type OrdemServicoStatus = 'SOLICITACAO' | 'ANALISE' | 'APROVACAO' | 'EMISSAO' | 'EXECUCAO' | 'ENCERRAMENTO' | 'HISTORICO';

export type OrdemServico = {
  id: string;
  empresa_id: string;
  equipamento_id: string;
  componente_id?: string | null;
  tag: string;
  solicitante_id: string;
  responsavel_id?: string | null;
  prioridade: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';
  descricao: string;
  status: OrdemServicoStatus;
  data_abertura: string;
  data_fechamento?: string | null;
  tempo_execucao_min?: number | null;
};
