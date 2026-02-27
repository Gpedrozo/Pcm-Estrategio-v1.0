export const PLATFORM_V2_APP_BASE = '/platform-v2/app';

export const PLATFORM_V2_APP_ROUTES = {
  dashboard: `${PLATFORM_V2_APP_BASE}/dashboard`,
  equipamentos: `${PLATFORM_V2_APP_BASE}/equipamentos`,
  ordensServico: `${PLATFORM_V2_APP_BASE}/os`,
  execucoes: `${PLATFORM_V2_APP_BASE}/execucoes`,
  indicadores: `${PLATFORM_V2_APP_BASE}/indicadores`,
  usuarios: `${PLATFORM_V2_APP_BASE}/usuarios`,
} as const;
