import { assertTenantContext } from '../../core/tenant/tenantContext';
import { ensurePermission } from '../../core/security/permissionMatrix';

export type ApiRequest = {
  method: string;
  route: 'equipamentos' | 'ordens-servico' | 'execucoes' | 'indicadores' | 'usuarios' | 'empresas';
  tenant: {
    empresaId: string;
    userId: string;
    role: 'ADMIN' | 'GESTOR' | 'MECANICO' | 'SOLICITANTE' | 'USUARIO' | 'MASTER_TI';
  };
};

export function authorizeV1Request(input: ApiRequest) {
  const tenant = assertTenantContext(input.tenant);

  if (input.route === 'equipamentos') ensurePermission(tenant.role, 'equipamentos:read');
  if (input.route === 'ordens-servico') ensurePermission(tenant.role, 'os:create');
  if (input.route === 'execucoes') ensurePermission(tenant.role, 'os:execute');
  if (input.route === 'indicadores') ensurePermission(tenant.role, 'indicadores:read');
  if (input.route === 'usuarios') ensurePermission(tenant.role, 'usuarios:manage');

  return {
    empresaId: tenant.empresaId,
    userId: tenant.userId,
    route: input.route,
    method: input.method,
  };
}
