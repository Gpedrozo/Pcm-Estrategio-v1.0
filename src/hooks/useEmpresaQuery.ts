import { useEmpresa } from '@/contexts/EmpresaContext';
import { useCallback } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { insertWithEmpresaId, selectFromEmpresa } from '@/services/empresaQueryService';

type TableName = keyof Database['public']['Tables'];

/**
 * Hook centralizado para queries multi-empresa.
 * Estabilizado com useMemo para evitar re-renders infinitos.
 */
export function useEmpresaQuery() {
  const { empresa } = useEmpresa();
  const empresaId = empresa?.id || null;

  /** Retorna query builder filtrado por empresa_id */
  const fromEmpresa = useCallback(
    <T extends TableName>(table: T) => {
      return selectFromEmpresa(table, empresaId);
    },
    [empresaId]
  );

  /** Adiciona empresa_id ao objeto de insert */
  const withEmpresa = useCallback(
    <T extends Record<string, unknown>>(data: T): T & { empresa_id: string | null } => {
      return { ...data, empresa_id: empresaId };
    },
    [empresaId]
  );

  /** Insert com empresa_id automático */
  const insertWithEmpresa = useCallback(
    async (table: string, data: Record<string, unknown>) => {
      return insertWithEmpresaId(table, data, empresaId);
    },
    [empresaId]
  );

  return { empresaId, fromEmpresa, withEmpresa, insertWithEmpresa };
}
