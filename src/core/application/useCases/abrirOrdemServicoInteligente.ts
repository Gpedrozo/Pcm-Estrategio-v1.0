import type { OrdemServicoRepository, StructuredLogger, TenantContext } from '@/core/application/ports';
import type { PrioridadeOS } from '@/core/domain/entities';

export interface AbrirOSInput {
  tag: string;
  equipamento: string;
  componenteCodigo: string;
  componenteNome: string;
  local: string | null;
  prioridade: PrioridadeOS;
  problema: string;
  fotos: string[];
}

export class AbrirOrdemServicoInteligenteUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly logger: StructuredLogger,
  ) {}

  async execute(input: AbrirOSInput, tenant: TenantContext) {
    if (!input.problema.trim()) {
      throw new Error('Descrição do problema é obrigatória.');
    }

    const componente = `${input.componenteCodigo} - ${input.componenteNome}`;

    await this.ordemServicoRepository.createFromQrFlow(
      {
        tag: input.tag,
        equipamento: input.equipamento,
        componente,
        local: input.local,
        prioridade: input.prioridade,
        problema: input.problema.trim(),
        fotos: input.fotos,
      },
      tenant,
    );

    await this.logger.info('OS_OPENED_FROM_QR_FLOW', {
      empresa_id: tenant.empresaId,
      user_id: tenant.userId,
      tag: input.tag,
      componente,
      prioridade: input.prioridade,
    });
  }
}
