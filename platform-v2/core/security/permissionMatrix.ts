type Action =
  | 'equipamentos:read'
  | 'equipamentos:write'
  | 'os:create'
  | 'os:approve'
  | 'os:execute'
  | 'os:close'
  | 'indicadores:read'
  | 'usuarios:manage';

type Role = 'ADMIN' | 'GESTOR' | 'MECANICO' | 'SOLICITANTE' | 'USUARIO' | 'MASTER_TI';

const matrix: Record<Role, Action[]> = {
  ADMIN: ['equipamentos:read', 'equipamentos:write', 'os:create', 'os:approve', 'os:execute', 'os:close', 'indicadores:read', 'usuarios:manage'],
  GESTOR: ['equipamentos:read', 'equipamentos:write', 'os:create', 'os:approve', 'indicadores:read'],
  MECANICO: ['equipamentos:read', 'os:execute', 'os:close'],
  SOLICITANTE: ['equipamentos:read', 'os:create'],
  USUARIO: ['equipamentos:read'],
  MASTER_TI: ['equipamentos:read', 'equipamentos:write', 'os:create', 'os:approve', 'os:execute', 'os:close', 'indicadores:read', 'usuarios:manage'],
};

export function ensurePermission(role: Role, action: Action) {
  if (!matrix[role]?.includes(action)) {
    throw new Error(`Permissão negada: ${role} não pode ${action}`);
  }
}
