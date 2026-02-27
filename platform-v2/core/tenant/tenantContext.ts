export type TenantContext = {
  empresaId: string;
  userId: string;
  role: 'ADMIN' | 'GESTOR' | 'MECANICO' | 'SOLICITANTE' | 'USUARIO' | 'MASTER_TI';
};

export function assertTenantContext(context: Partial<TenantContext>): TenantContext {
  if (!context.empresaId) throw new Error('empresa_id obrigatório');
  if (!context.userId) throw new Error('user_id obrigatório');
  if (!context.role) throw new Error('role obrigatório');

  return {
    empresaId: context.empresaId,
    userId: context.userId,
    role: context.role,
  };
}
