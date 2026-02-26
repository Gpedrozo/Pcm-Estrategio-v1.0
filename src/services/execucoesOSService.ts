import type { ExecucaoOS } from '@/types';

type QueryResponse = { data: unknown[] | null; error: Error | null };
type ExecucaoQueryBuilder = { order: (column: string, options: { ascending: boolean }) => Promise<QueryResponse> };

export async function fetchExecucoesOS(fromEmpresa: (table: 'execucoes_os') => ExecucaoQueryBuilder) {
  const { data, error } = await fromEmpresa('execucoes_os').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ExecucaoOS[];
}
