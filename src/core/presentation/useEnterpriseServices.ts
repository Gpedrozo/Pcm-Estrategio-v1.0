import { useMemo } from 'react';
import { GetEquipamentoByTagUseCase } from '@/core/application/useCases/getEquipamentoByTag';
import { AbrirOrdemServicoInteligenteUseCase } from '@/core/application/useCases/abrirOrdemServicoInteligente';
import { GerarQrUrlEquipamentoUseCase } from '@/core/application/useCases/gerarQrUrlEquipamento';
import { SupabaseEquipamentoRepository } from '@/core/infrastructure/repositories/supabaseEquipamentoRepository';
import { SupabaseOrdemServicoRepository } from '@/core/infrastructure/repositories/supabaseOrdemServicoRepository';
import { SystemLogger } from '@/core/infrastructure/observability/systemLogger';

export function useEnterpriseServices() {
  return useMemo(() => {
    const equipamentoRepository = new SupabaseEquipamentoRepository();
    const ordemServicoRepository = new SupabaseOrdemServicoRepository();
    const logger = new SystemLogger();

    return {
      getEquipamentoByTagUseCase: new GetEquipamentoByTagUseCase(equipamentoRepository),
      abrirOrdemServicoInteligenteUseCase: new AbrirOrdemServicoInteligenteUseCase(ordemServicoRepository, logger),
      gerarQrUrlEquipamentoUseCase: new GerarQrUrlEquipamentoUseCase(),
      logger,
    };
  }, []);
}
