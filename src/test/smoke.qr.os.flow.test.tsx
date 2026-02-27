import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import GerarQRCode from '@/modules/equipamentos/GerarQRCode';
import ImprimirEtiqueta from '@/modules/equipamentos/ImprimirEtiqueta';
import AbrirOrdemServico from '@/modules/equipamentos/AbrirOrdemServico';

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockMaybeSingle = vi.fn();

let currentAuth = { isAdmin: true, user: { id: 'u-admin', nome: 'Admin', tipo: 'ADMIN' as const } };
let currentTag = 'EQ-001';
let equipamentoResult: any = {
  id: 'eq-1',
  tag: 'EQ-001',
  nome: 'Bomba Principal',
  localizacao: 'Utilidades',
  fabricante: 'KSB',
  modelo: 'X1',
  ativo: true,
};

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => currentAuth,
}));

vi.mock('@/hooks/useEmpresaQuery', () => ({
  useEmpresaQuery: () => ({
    empresaId: 'empresa-a',
    fromEmpresa: () => ({
      eq: () => ({ maybeSingle: mockMaybeSingle }),
    }),
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    useParams: () => ({ tag: currentTag }),
  };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
  },
}));

vi.mock('@/modules/equipamentos/ArvoreEstrutural', () => ({
  default: ({ onSelectComponente }: { onSelectComponente: (node: any) => void }) => (
    <div>
      <button
        type="button"
        onClick={() => onSelectComponente({ id: 'c1', codigo: 'MTR-01', nome: 'Motor', tipo: 'COMPONENTE' })}
      >
        Selecionar Componente Mock
      </button>
    </div>
  ),
}));

vi.mock('@/modules/equipamentos/AbrirOrdemServico', () => ({
  default: () => <div data-testid="abrir-os-form">Form OS</div>,
}));

import EquipamentoPage from '@/modules/equipamentos/EquipamentoPage';

beforeEach(() => {
  vi.clearAllMocks();
  currentAuth = { isAdmin: true, user: { id: 'u-admin', nome: 'Admin', tipo: 'ADMIN' as const } };
  currentTag = 'EQ-001';
  equipamentoResult = {
    id: 'eq-1',
    tag: 'EQ-001',
    nome: 'Bomba Principal',
    localizacao: 'Utilidades',
    fabricante: 'KSB',
    modelo: 'X1',
    ativo: true,
  };
  mockMaybeSingle.mockResolvedValue({ data: equipamentoResult });
  mockInsert.mockResolvedValue({ error: null });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'ordens_servico') {
      return {
        insert: mockInsert,
      };
    }
    return {
      select: () => ({ eq: () => ({ order: () => ({ order: () => Promise.resolve({ data: [] }) }) }) }),
    };
  });
});

describe('Smoke QR + Árvore + O.S', () => {
  it('deve validar migrations críticas e campos obrigatórios no SQL', () => {
    const migrationA = resolve(process.cwd(), 'supabase/migrations/20260226103000_professional_os_workflow.sql');
    const migrationB = resolve(process.cwd(), 'supabase/migrations/20260226113000_qr_arvore_os_inteligente.sql');

    expect(existsSync(migrationA)).toBe(true);
    expect(existsSync(migrationB)).toBe(true);

    const contentA = readFileSync(migrationA, 'utf-8');
    const contentB = readFileSync(migrationB, 'utf-8');

    expect(contentA).toContain('ALTER TABLE public.ordens_servico');
    expect(contentA).toContain('CREATE TABLE IF NOT EXISTS public.historico_os');

    expect(contentB).toContain('ADD COLUMN IF NOT EXISTS componente');
    expect(contentB).toContain('ADD COLUMN IF NOT EXISTS local');
    expect(contentB).toContain('ADD COLUMN IF NOT EXISTS fotos');
    expect(contentB).toContain('CREATE OR REPLACE VIEW public.estrutura_componentes');
  });

  it('deve renderizar QR e URL no padrão /equipamento/{TAG}', () => {
    render(<GerarQRCode tag="EQ-001" nome="Bomba" />);

    const urlInput = screen.getByDisplayValue(/\/equipamento\/EQ-001$/i) as HTMLInputElement;
    expect(urlInput).toBeInTheDocument();

    const qrImage = screen.getByAltText('QR Code EQ-001') as HTMLImageElement;
    expect(qrImage.src).toContain('/v1/create-qr-code/');
    expect(qrImage.src).toContain(encodeURIComponent('/equipamento/EQ-001'));
  });

  it('deve exibir impressão com tamanhos 10x10 e 5x5', () => {
    render(<ImprimirEtiqueta tag="EQ-001" nome="Bomba" />);

    expect(screen.getByText('10 cm x 10 cm')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('5 cm x 5 cm')).toBeInTheDocument();
  });

  it('deve carregar rota /equipamento/{TAG} com dados corretos', async () => {
    render(<EquipamentoPage />);

    await waitFor(() => {
      expect(screen.getByText('Equipamento via QR Code')).toBeInTheDocument();
      expect(screen.getByText('EQ-001')).toBeInTheDocument();
      expect(screen.getByText('Bomba Principal')).toBeInTheDocument();
    });
  });

  it('deve permitir selecionar componente e abrir O.S para admin', async () => {
    render(<EquipamentoPage />);

    fireEvent.click(await screen.findByText('Selecionar Componente Mock'));
    expect(screen.getByText('Componente selecionado')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Abrir Ordem de Serviço'));
    expect(await screen.findByTestId('abrir-os-form')).toBeInTheDocument();
  });

  it('deve bloquear emissão de O.S para perfil USUARIO', async () => {
    currentAuth = { isAdmin: false, user: { id: 'u-user', nome: 'Usuário', tipo: 'USUARIO' as const } };

    render(<EquipamentoPage />);
    fireEvent.click(await screen.findByText('Selecionar Componente Mock'));

    expect(screen.getByText(/não abrir O\.S/i)).toBeInTheDocument();
    expect(screen.queryByText('Abrir Ordem de Serviço')).not.toBeInTheDocument();
  });

  it('deve criar O.S inteligente com campos obrigatórios no insert', async () => {
    render(
      <AbrirOrdemServico
        equipamento={{ tag: 'EQ-001', nome: 'Bomba Principal', localizacao: 'Utilidades' }}
        componente={{ id: 'c1', codigo: 'MTR-01', nome: 'Motor', tipo: 'COMPONENTE' }}
      />,
    );

    fireEvent.change(screen.getByLabelText('Descrição do problema'), { target: { value: 'Vibração anormal' } });
    fireEvent.click(screen.getByText('Abrir Ordem de Serviço'));

    await waitFor(() => expect(mockInsert).toHaveBeenCalled());

    const payload = mockInsert.mock.calls[0][0];
    expect(payload.tag).toBe('EQ-001');
    expect(payload.equipamento).toBe('Bomba Principal');
    expect(payload.componente).toContain('MTR-01 - Motor');
    expect(payload.local).toBe('Utilidades');
    expect(payload.status).toBe('ABERTA');
    expect(payload.empresa_id).toBe('empresa-a');
  });

  it('deve tratar TAG inexistente sem quebrar', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null });

    render(<EquipamentoPage />);
    await waitFor(() => {
      expect(screen.getByText(/Equipamento não encontrado para TAG/i)).toBeInTheDocument();
    });
  });

  it('deve simular isolamento multiempresa negando equipamento de outra empresa', async () => {
    equipamentoResult = null;
    mockMaybeSingle.mockResolvedValue({ data: null });

    currentTag = 'EQ-OUTRA-EMPRESA';
    render(<EquipamentoPage />);

    await waitFor(() => {
      expect(screen.getByText(/Equipamento não encontrado/i)).toBeInTheDocument();
    });
  });

  it('deve manter carregamento da rota abaixo de 2 segundos no cenário mockado', async () => {
    const start = performance.now();
    render(<EquipamentoPage />);
    await screen.findByText('Equipamento via QR Code');
    const durationMs = performance.now() - start;

    expect(durationMs).toBeLessThan(2000);
  });
});
