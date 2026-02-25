import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook que protege rotas baseado no módulo do plano.
 * Redireciona para /dashboard se módulo não está ativo.
 */
export function useModuloGuard(modulo: string) {
  const { moduloAtivo, isLoading } = useEmpresa();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;
    if (!moduloAtivo(modulo)) {
      toast({
        title: 'Módulo não disponível',
        description: `O módulo "${modulo}" não está incluído no seu plano atual.`,
        variant: 'destructive',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [modulo, moduloAtivo, isLoading, navigate, toast]);

  return { allowed: moduloAtivo(modulo), isLoading };
}
