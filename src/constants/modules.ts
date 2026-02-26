export const MODULES = {
  DASHBOARD: 'dashboard',
  ORDENS_SERVICO: 'ordens_servico',
  PLANEJAMENTO: 'planejamento',
  ANALISES: 'analises',
  CADASTROS: 'cadastros',
  RELATORIOS: 'relatorios',
  SSMA: 'ssma',
  ADMIN: 'admin',
  ANALISE_IA: 'analise_ia',
  MASTER_TI: 'master_ti',
} as const;

export type ModuleName = (typeof MODULES)[keyof typeof MODULES];

export const MODULE_OPTIONS: ModuleName[] = [
  MODULES.DASHBOARD,
  MODULES.ORDENS_SERVICO,
  MODULES.PLANEJAMENTO,
  MODULES.ANALISES,
  MODULES.ANALISE_IA,
  MODULES.CADASTROS,
  MODULES.RELATORIOS,
  MODULES.SSMA,
  MODULES.ADMIN,
  MODULES.MASTER_TI,
];

const MODULE_ALIASES: Record<string, ModuleName> = {
  dashboard: MODULES.DASHBOARD,

  ordens_servico: MODULES.ORDENS_SERVICO,
  solicitacoes: MODULES.ORDENS_SERVICO,
  emitir_os: MODULES.ORDENS_SERVICO,
  fechar_os: MODULES.ORDENS_SERVICO,
  historico_os: MODULES.ORDENS_SERVICO,
  backlog: MODULES.ORDENS_SERVICO,

  planejamento: MODULES.PLANEJAMENTO,
  programacao: MODULES.PLANEJAMENTO,
  preventiva: MODULES.PLANEJAMENTO,
  preditiva: MODULES.PLANEJAMENTO,
  inspecoes: MODULES.PLANEJAMENTO,
  lubrificacao: MODULES.PLANEJAMENTO,

  analises: MODULES.ANALISES,
  fmea: MODULES.ANALISES,
  rca: MODULES.ANALISES,
  melhorias: MODULES.ANALISES,

  analise_ia: MODULES.ANALISE_IA,

  cadastros: MODULES.CADASTROS,
  hierarquia: MODULES.CADASTROS,
  equipamentos: MODULES.CADASTROS,
  mecanicos: MODULES.CADASTROS,
  materiais: MODULES.CADASTROS,
  fornecedores: MODULES.CADASTROS,
  contratos: MODULES.CADASTROS,
  documentos: MODULES.CADASTROS,

  relatorios: MODULES.RELATORIOS,
  custos: MODULES.RELATORIOS,

  ssma: MODULES.SSMA,

  admin: MODULES.ADMIN,
  usuarios: MODULES.ADMIN,
  auditoria: MODULES.ADMIN,

  master_ti: MODULES.MASTER_TI,
};

export function normalizeModuleName(moduleName: string): ModuleName | null {
  const normalized = moduleName.trim().toLowerCase().replace(/-/g, '_');
  return MODULE_ALIASES[normalized] ?? null;
}

export function normalizeModuleList(moduleNames: string[] | null | undefined): ModuleName[] {
  if (!moduleNames?.length) return [];
  const normalized = moduleNames
    .map(normalizeModuleName)
    .filter((moduleName): moduleName is ModuleName => moduleName !== null);
  return Array.from(new Set(normalized));
}
