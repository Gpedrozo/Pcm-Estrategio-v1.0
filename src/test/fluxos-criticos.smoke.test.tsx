import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '@/pages/Dashboard';
import Equipamentos from '@/pages/Equipamentos';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', nome: 'Admin', tipo: 'ADMIN' },
    isAdmin: true,
    isMasterTI: false,
  }),
}));

vi.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    indicadores: {
      osAbertas: 1,
      osEmAndamento: 1,
      osFechadas: 1,
      tempoMedioExecucao: 30,
      tempoMedioAtendimento: 15,
      mtbf: 720,
      mttr: 2,
      disponibilidade: 99,
      backlogQuantidade: 1,
      backlogTempo: 1,
      backlogSemanas: 0.2,
      aderenciaProgramacao: 90,
      custoTotalMes: 100,
      custoMaoObraMes: 40,
      custoMateriaisMes: 40,
      custoTerceirosMes: 20,
    },
    osDistribuicaoPorTipo: [],
    osDistribuicaoPorStatus: [],
    custosMensais: [],
    backlogStats: { urgentes: 0, atrasadas: 0 },
    osRecentes: [],
    aderenciaPreventiva: 90,
    taxaCorretivaPreventiva: { corretivas: 1, preventivas: 1, ratio: 50 },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useEmpresaQuery', () => ({
  useEmpresaQuery: () => ({
    empresaId: 'e1',
    fromEmpresa: () => ({ order: async () => ({ data: [] }) }),
    insertWithEmpresa: async () => ({ error: null }),
  }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const equipamentos = [
    {
      id: 'eq1',
      tag: 'EQ-001',
      nome: 'Bomba',
      criticidade: 'A',
      nivel_risco: 'ALTO',
      localizacao: 'Utilidades',
      fabricante: 'KSB',
      modelo: 'X',
      numero_serie: 'SN1',
      data_instalacao: null,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      empresa_id: 'e1',
    },
  ];

  const builderFactory = (table: string) => {
    const builder: any = {
      data: table === 'equipamentos' ? equipamentos : table === 'ordens_servico' ? [{ tag: 'EQ-001' }] : [],
      count: table === 'equipamentos' ? 1 : null,
      select: () => builder,
      order: () => builder,
      range: () => builder,
      eq: () => builder,
      or: () => builder,
      in: () => builder,
      update: () => builder,
      insert: () => builder,
    };
    return builder;
  };

  return {
    supabase: {
      from: (table: string) => builderFactory(table),
    },
  };
});

describe('Smoke de fluxos críticos', () => {
  it('Dashboard deve carregar estrutura principal', async () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard PCM')).toBeInTheDocument();
    expect(screen.getByText('Indicadores Operacionais')).toBeInTheDocument();
  });

  it('Equipamentos deve carregar listagem sem quebrar', async () => {
    render(<Equipamentos />);
    await waitFor(() => {
      expect(screen.getByText('Gestão de Equipamentos')).toBeInTheDocument();
      expect(screen.getByText('EQ-001')).toBeInTheDocument();
    });
  });
});
