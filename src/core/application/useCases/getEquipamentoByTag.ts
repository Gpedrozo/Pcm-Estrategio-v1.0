import type { EquipamentoRepository, TenantContext } from '@/core/application/ports';

export class GetEquipamentoByTagUseCase {
  constructor(private readonly equipamentoRepository: EquipamentoRepository) {}

  async execute(tag: string, tenant: TenantContext) {
    return this.equipamentoRepository.getByTag(tag, tenant);
  }
}
