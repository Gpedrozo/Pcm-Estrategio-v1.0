import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmpresa } from '@/contexts/EmpresaContext';

/**
 * Hook centralizado para registrar ações de auditoria.
 */
export function useAuditoria() {
  const { user } = useAuth();
  const { empresa } = useEmpresa();

  const registrar = useCallback(
    async (acao: string, descricao: string, tag?: string) => {
      if (!user) return;
      try {
        await supabase.from('auditoria').insert({
          usuario_id: user.id,
          usuario_nome: user.nome,
          empresa_id: empresa?.id || null,
          acao,
          descricao,
          tag: tag || null,
        });
      } catch (error) {
        console.error('Erro ao registrar auditoria:', error);
      }
    },
    [user, empresa]
  );

  return { registrar };
}
