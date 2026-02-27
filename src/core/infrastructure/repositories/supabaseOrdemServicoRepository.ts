import { supabase } from '@/integrations/supabase/client';
import type { OrdemServicoRepository, OrdemServicoCreateInput, TenantContext } from '@/core/application/ports';

export class SupabaseOrdemServicoRepository implements OrdemServicoRepository {
  async createFromQrFlow(input: OrdemServicoCreateInput, tenant: TenantContext) {
    const { error } = await supabase.from('ordens_servico').insert({
      empresa_id: tenant.empresaId,
      tipo: 'CORRETIVA',
      prioridade: input.prioridade,
      tag: input.tag,
      equipamento: input.equipamento,
      componente: input.componente,
      local: input.local,
      solicitante: tenant.userName,
      problema: input.problema,
      usuario_abertura_id: tenant.userId,
      usuario_abertura: tenant.userName,
      data_solicitacao: new Date().toISOString(),
      fotos: input.fotos,
      status: 'ABERTA',
    });

    if (error) {
      throw error;
    }
  }
}
