export const PLATFORM_ROUTES = {
  siteHome: '/',
  portalAcesso: '/acessar',
  catalogoSistemas: '/sistemas',
  adminGlobal: '/admin',
  adminAlias: '/gestao',
  sistemaDashboard: '/dashboard',
} as const;

export const GLOBAL_ADMIN_ROUTES = [
  '/admin',
  '/admin/empresas',
  '/admin/usuarios',
  '/admin/planos',
  '/admin/assinaturas',
  '/admin/metricas',
  '/admin/permissoes',
  '/admin/config',
] as const;

export const SAAS_ARCHITECTURE_GUARDRAILS = [
  'Arquitetura obrigatória em três camadas: site, admin global e sistemas operacionais.',
  'Administração global pertence à plataforma e não aos sistemas operacionais.',
  'Dados devem permanecer isolados por empresa (multiempresa).',
  'Novos módulos devem respeitar fluxo Site → Admin Global → Empresas → Usuários → Sistemas.',
] as const;

export function isGlobalAdminRoute(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isOperationalRoute(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/os/') || pathname.startsWith('/analise-ia') || pathname.startsWith('/solicitacoes') || pathname.startsWith('/equipamentos');
}
