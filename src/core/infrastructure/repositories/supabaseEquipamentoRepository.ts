import { supabase } from '@/integrations/supabase/client';
import type { EquipamentoRepository, TenantContext } from '@/core/application/ports';

export class SupabaseEquipamentoRepository implements EquipamentoRepository {
  async getByTag(tag: string, tenant: TenantContext) {
    const normalizedTag = String(tag || '').trim().toUpperCase();

    const { data, error } = await supabase
      .from('equipamentos')
      .select('*')
      .eq('empresa_id', tenant.empresaId)
      .eq('tag', normalizedTag)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }
}
