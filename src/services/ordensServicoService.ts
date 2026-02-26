import type { OrdemServico } from '@/types';

type QueryResponse = { data: unknown[] | null; error: Error | null };
type OrdemQueryBuilder = { order: (column: string, options: { ascending: boolean }) => Promise<QueryResponse> };

export async function fetchOrdensServico(fromEmpresa: (table: 'ordens_servico') => OrdemQueryBuilder) {
  const { data, error } = await fromEmpresa('ordens_servico').order('numero_os', { ascending: false });
  if (error) throw error;
  return (data || []) as OrdemServico[];
}
