import { MODULES, type ModuleName } from '@/constants/modules';

export const routeModules: Record<string, ModuleName> = {
  '/dashboard': MODULES.DASHBOARD,
  '/solicitacoes': MODULES.ORDENS_SERVICO,
  '/os/nova': MODULES.ORDENS_SERVICO,
  '/os/fechar': MODULES.ORDENS_SERVICO,
  '/os/historico': MODULES.ORDENS_SERVICO,
  '/backlog': MODULES.ORDENS_SERVICO,

  '/lubrificacao': MODULES.PLANEJAMENTO,
  '/programacao': MODULES.PLANEJAMENTO,
  '/preventiva': MODULES.PLANEJAMENTO,
  '/preditiva': MODULES.PLANEJAMENTO,
  '/inspecoes': MODULES.PLANEJAMENTO,

  '/fmea': MODULES.ANALISES,
  '/rca': MODULES.ANALISES,
  '/melhorias': MODULES.ANALISES,
  '/analise-ia': MODULES.ANALISE_IA,

  '/hierarquia': MODULES.CADASTROS,
  '/equipamentos': MODULES.CADASTROS,
  '/mecanicos': MODULES.CADASTROS,
  '/materiais': MODULES.CADASTROS,
  '/fornecedores': MODULES.CADASTROS,
  '/contratos': MODULES.CADASTROS,
  '/documentos': MODULES.CADASTROS,

  '/custos': MODULES.RELATORIOS,
  '/relatorios': MODULES.RELATORIOS,

  '/ssma': MODULES.SSMA,

  '/usuarios': MODULES.ADMIN,
  '/auditoria': MODULES.ADMIN,
  '/master-ti': MODULES.MASTER_TI,

  '/admin': MODULES.ADMIN,
  '/admin/empresas': MODULES.ADMIN,
  '/admin/usuarios': MODULES.ADMIN,
  '/admin/planos': MODULES.ADMIN,
  '/admin/assinaturas': MODULES.ADMIN,
  '/admin/metricas': MODULES.ADMIN,
  '/admin/permissoes': MODULES.ADMIN,
  '/admin/config': MODULES.ADMIN,
};

export function getRouteModule(pathname: string): ModuleName | null {
  return routeModules[pathname] ?? null;
}
