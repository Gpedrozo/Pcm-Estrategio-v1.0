import { supabase } from '@/integrations/supabase/client';

type InsertWithEmpresaFn = (table: string, data: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;

type FromEmpresaFn = (table: string) => {
  order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: unknown[] | null; error?: { message: string } | null }>;
};

export async function loadEntityList(
  fromEmpresa: FromEmpresaFn,
  table: string,
  orderBy: string,
  ascending = true,
) {
  const { data, error } = await fromEmpresa(table).order(orderBy, { ascending });
  return { data: data || [], error: error || null };
}

export async function createEntity(
  insertWithEmpresa: InsertWithEmpresaFn,
  table: string,
  payload: Record<string, unknown>,
) {
  return insertWithEmpresa(table, payload);
}

export async function updateEntityById(
  table: string,
  id: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabase.from(table as never).update(payload as never).eq('id', id);
  return { error };
}

export async function toggleEntityAtivo(
  table: string,
  id: string,
  ativoAtual: boolean,
) {
  const { error } = await supabase.from(table as never).update({ ativo: !ativoAtual } as never).eq('id', id);
  return { error, ativoNovo: !ativoAtual };
}
