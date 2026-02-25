import { useEmpresa } from '@/contexts/EmpresaContext';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

/**
 * Hook centralizado para queries multi-empresa.
 */
export function useEmpresaQuery() {
  const { empresa } = useEmpresa();
  const empresaId = empresa?.id || null;

  /** Retorna query builder filtrado por empresa_id */
  const fromEmpresa = useCallback(
    <T extends TableName>(table: T) => {
      const query = supabase.from(table).select('*');
      if (empresaId) {
        return query.eq('empresa_id' as any, empresaId);
      }
      return query;
    },
    [empresaId]
  );

  /** Adiciona empresa_id ao objeto de insert */
  const withEmpresa = useCallback(
    <T extends Record<string, any>>(data: T): T & { empresa_id: string | null } => {
      return { ...data, empresa_id: empresaId };
    },
    [empresaId]
  );

  /** Insert com empresa_id automático */
  const insertWithEmpresa = useCallback(
    async (table: string, data: Record<string, any>) => {
      return supabase.from(table as any).insert(withEmpresa(data) as any);
    },
    [withEmpresa]
  );

  return { empresaId, fromEmpresa, withEmpresa, insertWithEmpresa };
}
