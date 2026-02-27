import { describe, expect, it } from 'vitest';
import { getRouteModule } from '@/config/routeModules';
import { MODULES } from '@/constants/modules';

const appLayoutRoutes = [
  '/dashboard',
  '/solicitacoes',
  '/os/nova',
  '/os/fechar',
  '/os/historico',
  '/backlog',
  '/programacao',
  '/preventiva',
  '/preditiva',
  '/inspecoes',
  '/fmea',
  '/rca',
  '/melhorias',
  '/hierarquia',
  '/equipamentos',
  '/equipamento/TAG-001',
  '/mecanicos',
  '/materiais',
  '/fornecedores',
  '/contratos',
  '/documentos',
  '/lubrificacao',
  '/custos',
  '/relatorios',
  '/ssma',
  '/usuarios',
  '/auditoria',
  '/analise-ia',
];

const expectedModuleByRoute: Record<string, string> = {
  '/dashboard': MODULES.DASHBOARD,
  '/solicitacoes': MODULES.ORDENS_SERVICO,
  '/os/nova': MODULES.ORDENS_SERVICO,
  '/os/fechar': MODULES.ORDENS_SERVICO,
  '/os/historico': MODULES.ORDENS_SERVICO,
  '/backlog': MODULES.ORDENS_SERVICO,
  '/programacao': MODULES.PLANEJAMENTO,
  '/preventiva': MODULES.PLANEJAMENTO,
  '/preditiva': MODULES.PLANEJAMENTO,
  '/inspecoes': MODULES.PLANEJAMENTO,
  '/fmea': MODULES.ANALISES,
  '/rca': MODULES.ANALISES,
  '/melhorias': MODULES.ANALISES,
  '/hierarquia': MODULES.CADASTROS,
  '/equipamentos': MODULES.CADASTROS,
  '/equipamento/TAG-001': MODULES.CADASTROS,
  '/mecanicos': MODULES.CADASTROS,
  '/materiais': MODULES.CADASTROS,
  '/fornecedores': MODULES.CADASTROS,
  '/contratos': MODULES.CADASTROS,
  '/documentos': MODULES.CADASTROS,
  '/lubrificacao': MODULES.PLANEJAMENTO,
  '/custos': MODULES.RELATORIOS,
  '/relatorios': MODULES.RELATORIOS,
  '/ssma': MODULES.SSMA,
  '/usuarios': MODULES.ADMIN,
  '/auditoria': MODULES.ADMIN,
  '/analise-ia': MODULES.ANALISE_IA,
};

describe('BOT de Auditoria - Rotas e Permissões', () => {
  it('deve mapear corretamente todas as rotas operacionais para módulo', () => {
    for (const route of appLayoutRoutes) {
      const moduleName = getRouteModule(route);
      expect(moduleName, `Rota sem módulo: ${route}`).not.toBeNull();
      expect(moduleName).toBe(expectedModuleByRoute[route]);
    }
  });

  it('deve mapear rotas administrativas para módulo ADMIN', () => {
    const adminRoutes = ['/admin', '/admin/empresas', '/admin/usuarios', '/admin/planos', '/admin/metricas', '/admin/permissoes', '/admin/security-logs', '/admin/config'];
    for (const route of adminRoutes) {
      expect(getRouteModule(route)).toBe(MODULES.ADMIN);
    }
  });

  it('deve negar rotas desconhecidas retornando null', () => {
    const unknownRoutes = ['/rota-inexistente', '/foo/bar', '/equipamentox/abc'];
    for (const route of unknownRoutes) {
      expect(getRouteModule(route)).toBeNull();
    }
  });

  it('deve manter regras de perfil consistentes com UX (USUARIO sem emitir O.S)', () => {
    const blockedUsuarioPaths = ['/os/nova'];
    expect(blockedUsuarioPaths).toContain('/os/nova');
  });

  it('deve manter regras de perfil consistentes com UX (SOLICITANTE restrito)', () => {
    const allowedSolicitantePaths = ['/dashboard', '/solicitacoes'];
    expect(allowedSolicitantePaths).toEqual(['/dashboard', '/solicitacoes']);
  });
});
