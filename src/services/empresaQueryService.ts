import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

export function selectFromEmpresa<T extends TableName>(table: T, empresaId: string | null) {
  const query = supabase.from(table).select('*');
  return empresaId ? query.eq('empresa_id', empresaId) : query;
}

export function insertWithEmpresaId(table: string, data: Record<string, unknown>, empresaId: string | null) {
  return supabase.from(table as never).insert({ ...data, empresa_id: empresaId } as never);
}
