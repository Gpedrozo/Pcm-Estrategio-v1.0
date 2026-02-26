import type { ExecucaoOS, OrdemServico } from '@/types';

type QueryResponse = { data: unknown[] | null };

export async function fetchIndicadoresBaseData(
  fromEmpresa: (table: 'ordens_servico' | 'execucoes_os') => Promise<QueryResponse>
) {
  const [ordensRes, execRes] = await Promise.all([
    fromEmpresa('ordens_servico'),
    fromEmpresa('execucoes_os'),
  ]);

  return {
    ordens: (ordensRes.data || []) as OrdemServico[],
    execucoes: (execRes.data || []) as ExecucaoOS[],
  };
}
