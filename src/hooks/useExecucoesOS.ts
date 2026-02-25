import { useQuery } from '@tanstack/react-query';
import { useEmpresaQuery } from './useEmpresaQuery';

export function useExecucoesOS() {
  const { fromEmpresa, empresaId } = useEmpresaQuery();

  return useQuery({
    queryKey: ['execucoes-os', empresaId],
    queryFn: async () => {
      const { data, error } = await fromEmpresa('execucoes_os')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
