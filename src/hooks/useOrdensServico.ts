import { useQuery } from '@tanstack/react-query';
import { useEmpresaQuery } from './useEmpresaQuery';

export function useOrdensServico() {
  const { fromEmpresa, empresaId } = useEmpresaQuery();

  return useQuery({
    queryKey: ['ordens-servico', empresaId],
    queryFn: async () => {
      const { data, error } = await fromEmpresa('ordens_servico')
        .order('numero_os', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
