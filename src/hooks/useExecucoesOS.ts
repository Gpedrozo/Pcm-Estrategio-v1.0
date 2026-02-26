import { useQuery } from '@tanstack/react-query';
import { useEmpresaQuery } from './useEmpresaQuery';
import { fetchExecucoesOS } from '@/services/execucoesOSService';

export function useExecucoesOS() {
  const { fromEmpresa, empresaId } = useEmpresaQuery();

  return useQuery({
    queryKey: ['execucoes-os', empresaId],
    queryFn: async () => fetchExecucoesOS(fromEmpresa),
    enabled: !!empresaId,
  });
}
