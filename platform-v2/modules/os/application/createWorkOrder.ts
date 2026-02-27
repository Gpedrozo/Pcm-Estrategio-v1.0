import type { OrdemServico } from '../../../domain/entities';
import { ensurePermission } from '../../../core/security/permissionMatrix';
import type { TenantContext } from '../../../core/tenant/tenantContext';

export type WorkOrderRepository = {
  insert: (input: Partial<OrdemServico> & { empresa_id: string }) => Promise<OrdemServico>;
};

export async function createWorkOrder(
  tenant: TenantContext,
  payload: Pick<OrdemServico, 'equipamento_id' | 'tag' | 'descricao' | 'prioridade' | 'solicitante_id'>,
  repository: WorkOrderRepository
): Promise<OrdemServico> {
  ensurePermission(tenant.role, 'os:create');

  return repository.insert({
    empresa_id: tenant.empresaId,
    equipamento_id: payload.equipamento_id,
    tag: payload.tag,
    descricao: payload.descricao,
    prioridade: payload.prioridade,
    solicitante_id: payload.solicitante_id,
    status: 'SOLICITACAO',
    data_abertura: new Date().toISOString(),
  });
}
