import { useQuery } from '@tanstack/react-query';
import { useEmpresaQuery } from './useEmpresaQuery';
import type { Indicadores } from '@/types';
import { fetchIndicadoresBaseData } from '@/services/indicadoresService';

export function useIndicadores() {
  const { fromEmpresa, empresaId } = useEmpresaQuery();

  return useQuery({
    queryKey: ['indicadores', empresaId],
    queryFn: async () => {
      const { ordens, execucoes } = await fetchIndicadoresBaseData(fromEmpresa);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const osAbertas = ordens.filter(os => os.status === 'ABERTA').length;
      const osEmAndamento = ordens.filter(os =>
        os.status === 'EM_ANDAMENTO' || os.status === 'AGUARDANDO_MATERIAL'
      ).length;
      const osFechadas = ordens.filter(os => {
        if (os.status !== 'FECHADA' || !os.data_fechamento) return false;
        return new Date(os.data_fechamento) >= startOfMonth;
      }).length;

      const tempoMedioExecucao = execucoes.length > 0
        ? Math.round(execucoes.reduce((acc, ex) => acc + (ex.tempo_execucao || 0), 0) / execucoes.length)
        : 0;

      const execucoesComAtendimento = execucoes.filter((ex) => (ex.tempo_atendimento || 0) > 0);
      const tempoMedioAtendimento = execucoesComAtendimento.length > 0
        ? Math.round(execucoesComAtendimento.reduce((acc, ex) => acc + (ex.tempo_atendimento || 0), 0) / execucoesComAtendimento.length)
        : 0;

      const backlogOrdens = ordens.filter(os => os.status !== 'FECHADA');
      const backlogQuantidade = backlogOrdens.length;
      const backlogTempo = backlogOrdens.reduce((acc, os) => acc + (os.tempo_estimado || 0), 0) / 60;
      const backlogSemanas = backlogTempo / 40;

      const custoMaoObraMes = execucoes.reduce((acc, ex) => acc + (Number(ex.custo_mao_obra) || 0), 0);
      const custoMateriaisMes = execucoes.reduce((acc, ex) => acc + (Number(ex.custo_materiais) || 0), 0);
      const custoTerceirosMes = execucoes.reduce((acc, ex) => acc + (Number(ex.custo_terceiros) || 0), 0);
      const custoTotalMes = custoMaoObraMes + custoMateriaisMes + custoTerceirosMes;

      const closedWithExec = execucoes.filter(ex => (ex.tempo_execucao || 0) > 0);
      const mttr = closedWithExec.length > 0
        ? closedWithExec.reduce((acc, ex) => acc + ex.tempo_execucao, 0) / closedWithExec.length / 60
        : 0;

      const mtbf = 720;
      const disponibilidade = mtbf > 0 ? (mtbf / (mtbf + mttr)) * 100 : 100;

      const preventivas = ordens.filter(os => os.tipo === 'PREVENTIVA').length;
      const totalOrdens = ordens.length;
      const aderenciaProgramacao = totalOrdens > 0 ? (preventivas / totalOrdens) * 100 : 0;

      const indicadores: Indicadores = {
        osAbertas,
        osEmAndamento,
        osFechadas,
        tempoMedioExecucao,
        tempoMedioAtendimento,
        mtbf,
        mttr: Math.round(mttr * 10) / 10,
        disponibilidade: Math.round(disponibilidade * 10) / 10,
        backlogQuantidade,
        backlogTempo: Math.round(backlogTempo * 10) / 10,
        backlogSemanas: Math.round(backlogSemanas * 10) / 10,
        aderenciaProgramacao: Math.round(aderenciaProgramacao * 10) / 10,
        custoTotalMes,
        custoMaoObraMes,
        custoMateriaisMes,
        custoTerceirosMes,
      };

      return indicadores;
    },
    enabled: !!empresaId,
  });
}
