import { supabase } from '@/integrations/supabase/client';

export type ApiTokenItem = {
  id: string;
  empresa_id: string;
  name: string;
  scopes: string[];
  active: boolean;
  expires_at: string | null;
  created_at: string;
  created_by?: string | null;
};

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('platform-admin-api-tokens', { body });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

export async function listApiTokens(empresaId?: string) {
  const data = await invoke({ action: 'list', empresaId });
  return (data.items || []) as ApiTokenItem[];
}

export async function createApiToken(params: {
  empresaId: string;
  name: string;
  scopes: string[];
  expiresAt?: string | null;
}) {
  const data = await invoke({
    action: 'create',
    empresaId: params.empresaId,
    name: params.name,
    scopes: params.scopes,
    expiresAt: params.expiresAt || null,
  });

  return {
    item: data.item as ApiTokenItem,
    plainToken: String(data.plainToken || ''),
  };
}

export async function revokeApiToken(tokenId: string) {
  await invoke({ action: 'revoke', tokenId });
}

export async function rotateApiToken(tokenId: string) {
  const data = await invoke({ action: 'rotate', tokenId });
  return {
    item: data.item as ApiTokenItem,
    plainToken: String(data.plainToken || ''),
  };
}
