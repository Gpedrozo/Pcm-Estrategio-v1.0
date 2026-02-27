import type { TenantContext } from '@/core/application/ports';

interface TenantInput {
  empresaId: string | null;
  userId: string | null;
  userName: string | null;
}

export function requireTenantContext(input: TenantInput): TenantContext {
  if (!input.empresaId) {
    throw new Error('Empresa não definida no contexto da sessão.');
  }

  if (!input.userId) {
    throw new Error('Usuário não autenticado.');
  }

  return {
    empresaId: input.empresaId,
    userId: input.userId,
    userName: input.userName || 'Usuário',
  };
}
