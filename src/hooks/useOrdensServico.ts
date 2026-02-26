import { useQuery } from '@tanstack/react-query';
import { useEmpresaQuery } from './useEmpresaQuery';
import { fetchOrdensServico } from '@/services/ordensServicoService';

export function useOrdensServico() {
  const { fromEmpresa, empresaId } = useEmpresaQuery();

  return useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => fetchOrdensServico(fromEmpresa),
    enabled: !!empresaId,
  });
}
